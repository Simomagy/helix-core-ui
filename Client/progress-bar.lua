-- Progress Bar System - HELIX Core UI
-- Customizable progress bars with multiple styles and positions

ProgressBar = {}
ProgressBar.__index = ProgressBar
ProgressBar.instances = {}
ProgressBar.UI = WebUI("ProgressBarUI", "core-ui/Client/ui/progress-bar/index.html")
ProgressBar.UIReady = false

-- Initialize UI
ProgressBar.UI:RegisterEventHandler("Ready", function()
    ProgressBar.UIReady = true

    -- Sync any pending bars
    for id, bar in pairs(ProgressBar.instances) do
        if bar.active and not bar.sent then
            ProgressBar.SendAddEvent(bar)
        end
    end
end)

-- Helper to send add event
function ProgressBar.SendAddEvent(bar)
    if not ProgressBar.UI or not ProgressBar.UIReady then return end

    ProgressBar.UI:SendEvent("AddProgressBar", {
        id = bar.id,
        text = bar.text,
        duration = bar.duration,
        position = bar.position,
        style = bar.style,
        color = bar.color
    })
    bar.sent = true

    -- Start tracking progress
    ProgressBar.StartTracking(bar.id)
end

-- Create a new progress bar
function ProgressBar.Create(id, config)
    config = config or {}

    -- Default configuration
    local bar = {
        id = id,
        text = config.text or "Processing...",
        duration = config.duration or 5000,
        position = config.position or "bottom-center", -- center, top-left, top-right, bottom-left, bottom-right, bottom-center
        style = config.style or "helix", -- helix, horizontal
        color = config.color or "white",
        onComplete = config.onComplete or function() end,
        onCancel = config.onCancel or function() end,

        -- Internal state
        active = true,
        startTime = os.clock(),
        sent = false,
        completed = false
    }

    ProgressBar.instances[id] = bar

    if ProgressBar.UIReady then
        ProgressBar.SendAddEvent(bar)
    end

    return bar
end

-- Track progress
function ProgressBar.StartTracking(id)
    Timer.CreateThread(function()
        local bar = ProgressBar.instances[id]
        if not bar then return end

        while bar.active and not bar.completed do
            local elapsed = (os.clock() - bar.startTime) * 1000
            local progress = math.min((elapsed / bar.duration) * 100, 100)

            -- Update UI
            if ProgressBar.UI then
                ProgressBar.UI:SendEvent("UpdateProgress", {
                    id = id,
                    progress = progress
                })
            end

            -- Check completion
            if progress >= 100 then
                bar.completed = true

                -- UI Completion Event
                if ProgressBar.UI then
                    ProgressBar.UI:SendEvent("CompleteProgressBar", { id = id })
                end

                -- Callback
                if bar.onComplete then
                    bar.onComplete()
                end

                -- Auto remove after a short delay (handled by UI usually, but we clean up data)
                Timer.SetTimeout(500, function()
                    ProgressBar.Remove(id)
                end)

                break
            end

            Timer.Wait(16) -- ~60fps update
        end
    end)
end

-- Remove a progress bar
function ProgressBar.Remove(id)
    local bar = ProgressBar.instances[id]
    if not bar then return end

    bar.active = false

    if ProgressBar.UI then
        ProgressBar.UI:SendEvent("RemoveProgressBar", { id = id })
    end

    -- If not completed and removed manually, trigger cancel
    if not bar.completed and bar.onCancel then
        bar.onCancel()
    end

    ProgressBar.instances[id] = nil
end

-- Clear all progress bars
function ProgressBar.Clear()
    for id, _ in pairs(ProgressBar.instances) do
        ProgressBar.Remove(id)
    end
end

-- Global reference
_G.ProgressBar = ProgressBar

-- Cleanup
function onShutdown()
    if ProgressBar.UI then
        ProgressBar.UI:Destroy()
        ProgressBar.UI = nil
    end
end

