-- Interaction System - New HELIX API
-- Multiple simultaneous interactions with progress bars

Interaction = {}
Interaction.__index = Interaction
Interaction.instances = {}
Interaction.UI = WebUI("InteractionUI", "core-ui/Client/ui/interaction/index.html")
Interaction.UIReady = false
Interaction.isVisible = false
Interaction.boundKeys = {}

Interaction.UI:RegisterEventHandler("Ready", function()
    Interaction.UIReady = true

    for id, interaction in pairs(Interaction.instances) do
        if interaction.active and not interaction.sent then
            Interaction.UI:SendEvent("AddInteraction", {
                id = id,
                text = interaction.text,
                key = interaction.key,
                duration = interaction.duration
            })
            interaction.sent = true
        end
    end
end)

Interaction.UI:RegisterEventHandler("AllInteractionsClosed", function()
    Interaction.Hide()
end)

function Interaction.Show()
    if Interaction.isVisible then return end
    Interaction.isVisible = true
end

function Interaction.Hide()
    if not Interaction.isVisible then return end
    Interaction.isVisible = false
end

function Interaction.CheckVisibility()
    local hasActive = false
    for _, interaction in pairs(Interaction.instances) do
        if interaction.active then
            hasActive = true
            break
        end
    end

    if hasActive then
        Interaction.Show()
    else
        Interaction.Hide()
    end
end

function Interaction.BindKey(key)
    if Interaction.boundKeys[key] then return end

    Input.BindKey(key, function()
        for id, interaction in pairs(Interaction.instances) do
            if interaction.active and interaction.key == key then
                if not interaction.pressing then
                    interaction.pressing = true
                    interaction.startTime = os.clock()
                    Interaction.UI:SendEvent("StartProgress", { id = id })
                    Interaction.StartProgressTracking(id)
                end
            end
        end
    end, 'Pressed')

    Input.BindKey(key, function()
        for id, interaction in pairs(Interaction.instances) do
            if interaction.active and interaction.key == key and interaction.pressing then
                local elapsed = (os.clock() - interaction.startTime) * 1000
                local progress = (elapsed / interaction.duration) * 100

                interaction.pressing = false
                interaction.completed = false

                if progress >= 100 then
                    Interaction.OnComplete(id)
                elseif progress > 10 then
                    Interaction.OnCancel(id)
                end

                Interaction.UI:SendEvent("ResetProgress", { id = id })
            end
        end
    end, 'Released')

    Interaction.boundKeys[key] = true
end

function Interaction.StartProgressTracking(id)
    Timer.CreateThread(function()
        local interaction = Interaction.instances[id]
        if not interaction then return end

        while interaction.pressing and interaction.active do
            local elapsed = (os.clock() - interaction.startTime) * 1000
            local progress = math.min((elapsed / interaction.duration) * 100, 100)

            Interaction.UI:SendEvent("UpdateProgress", { id = id, progress = progress })

            if progress >= 100 and not interaction.completed then
                interaction.completed = true
                interaction.pressing = false
                Interaction.OnComplete(id)
                break
            end

            Timer.Wait(10)
        end
    end)
end

-- Create a new interaction
function Interaction.Create(id, config)
    config = config or {}
    local interaction = {
        id = id,
        text = config.text or "Interact",
        key = config.key or "E",
        duration = config.duration or 2000,
        onComplete = config.onComplete or function() end,
        onCancel = config.onCancel or function() end,
        active = true,
        pressing = false,
        completed = false,
        startTime = 0,
        sent = false
    }

    Interaction.instances[id] = interaction

    Interaction.BindKey(interaction.key)

    if Interaction.UIReady then
        if Interaction.UI and interaction.active and not interaction.sent then
            Interaction.UI:SendEvent("AddInteraction", {
                id = id,
                text = interaction.text,
                key = interaction.key,
                duration = interaction.duration
            })
            interaction.sent = true
        end
    end

    Interaction.Show()

    return interaction
end

-- Remove an interaction
function Interaction.Remove(id)
    local interaction = Interaction.instances[id]
    if not interaction then return end

    interaction.active = false

    if Interaction.UI then
        Interaction.UI:SendEvent("RemoveInteraction", { id = id })
    end

    Interaction.instances[id] = nil

    Interaction.CheckVisibility()
end

-- Handle interaction completion
function Interaction.OnComplete(id)
    local interaction = Interaction.instances[id]
    if not interaction or not interaction.active then return end

    -- print("[Interaction] Completed:", id)

    -- Execute callback
    if interaction.onComplete then
        interaction.onComplete()
    end

    -- Remove the interaction
    Interaction.Remove(id)
end

-- Handle interaction cancellation
function Interaction.OnCancel(id)
    local interaction = Interaction.instances[id]
    if not interaction or not interaction.active then return end

    -- print("[Interaction] Cancelled:", id)

    -- Execute cancel callback
    if interaction.onCancel then
        interaction.onCancel()
    end
end

-- Remove all interactions
function Interaction.Clear()
    for id, _ in pairs(Interaction.instances) do
        Interaction.Remove(id)
    end
end

-- Cleanup on script unload
function Interaction.Destroy()
    Interaction.Clear()

    if Interaction.UI then
        Interaction.UI:Destroy()
        Interaction.UI = nil
        Interaction.UIReady = false
        Interaction.isVisible = false
    end

    -- print("[Interaction] System destroyed")
end

-- Global reference
_G.Interaction = Interaction

function onShutdown()
    Interaction.Destroy()
end
