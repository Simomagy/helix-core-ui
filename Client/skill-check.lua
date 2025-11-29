-- Skill Check System - HELIX Core UI
-- Minigame for action success/failure with timing mechanics

SkillCheck = {}
SkillCheck.__index = SkillCheck
SkillCheck.instances = {}
SkillCheck.UI = WebUI("SkillCheckUI", "core-ui/Client/ui/skill-check/index.html")
SkillCheck.UIReady = false

-- Initialize UI
SkillCheck.UI:RegisterEventHandler("Ready", function()
    SkillCheck.UIReady = true

    -- Sync any pending instances
    for id, check in pairs(SkillCheck.instances) do
        if check.active and not check.sent then
            SkillCheck.SendAddEvent(check)
        end
    end
end)

-- Handle Success Event from JS
SkillCheck.UI:RegisterEventHandler("SkillCheckSuccess", function(data)
    local check = SkillCheck.instances[data.id]
    if not check then return end

    if check.onSuccess then
        check.onSuccess()
    end

    SkillCheck.Remove(data.id)
end)

-- Handle Fail Event from JS
SkillCheck.UI:RegisterEventHandler("SkillCheckFail", function(data)
    local check = SkillCheck.instances[data.id]
    if not check then return end

    if check.onFail then
        check.onFail()
    end

    SkillCheck.Remove(data.id)
end)

-- Handle Key Press Event (feedback from UI if needed, though mostly client-side JS handled)
-- We bind keys here to intercept input
function SkillCheck.BindInput(check)
    -- Bind the specific key for this skill check
    Input.BindKey(check.key, function()
        if check.active and SkillCheck.UI then
            SkillCheck.UI:SendEvent("CheckKeyPress", { id = check.id })
        end
    end, 'Pressed')
end

-- Helper to send add event
function SkillCheck.SendAddEvent(check)
    if not SkillCheck.UI or not SkillCheck.UIReady then return end

    SkillCheck.UI:SendEvent("AddSkillCheck", {
        id = check.id,
        key = check.key,
        difficulty = check.difficulty,
        retries = check.retries,
        zoneSize = check.zoneSize
    })
    check.sent = true

    -- Bind input
    SkillCheck.BindInput(check)

    -- Focus UI
    SkillCheck.UI:SetInputMode(1)
end

-- Create a new skill check
function SkillCheck.Create(id, config)
    config = config or {}

    -- Remove existing if any
    if SkillCheck.instances[id] then
        SkillCheck.Remove(id)
    end

    -- Default configuration
    local check = {
        id = id,
        key = config.key or "E",
        difficulty = config.difficulty or 1, -- 1-5 speed multiplier
        retries = config.retries or 3,
        zoneSize = config.zoneSize or 20, -- Percentage width of success zone
        onSuccess = config.onSuccess or function() end,
        onFail = config.onFail or function() end,

        -- Internal state
        active = true,
        sent = false
    }

    SkillCheck.instances[id] = check

    if SkillCheck.UIReady then
        SkillCheck.SendAddEvent(check)
    end

    return check
end

-- Remove a skill check
function SkillCheck.Remove(id)
    local check = SkillCheck.instances[id]
    if not check then return end

    check.active = false

    if SkillCheck.UI then
        SkillCheck.UI:SendEvent("RemoveSkillCheck", { id = id })
    end

    -- Unbind is handled by Input system usually when references are lost or explicitly if API supports it
    -- Assuming simple overwrite or cleanup isn't strictly needed for single key binds per frame

    SkillCheck.instances[id] = nil
    SkillCheck.UI:SetInputMode(0)
end

-- Clear all
function SkillCheck.Clear()
    for id, _ in pairs(SkillCheck.instances) do
        SkillCheck.Remove(id)
    end
    SkillCheck.UI:SetInputMode(0)
end

-- Global reference
_G.SkillCheck = SkillCheck

-- Cleanup
function onShutdown()
    if SkillCheck.UI then
        SkillCheck.UI:Destroy()
        SkillCheck.UI:SetInputMode(0)
        SkillCheck.UI = nil
    end
end

