local Showcase = {}

-- -- Demo from documentation: Complete Settings Menu
function Showcase:ShowSettingsMenu()
    local menu = ContextMenu.new()

    menu:SetHeader("GAME SETTINGS")
    menu:setMenuInfo("Settings", "Configure your game preferences")

    menu:addSelect("quality", "Graphics Quality", {
        { value = "low",    text = "Low" },
        { value = "medium", text = "Medium" },
        { value = "high",   text = "High",  selected = true },
        { value = "ultra",  text = "Ultra" }
    }, function(quality)
        Notification.Success("Graphics", "Quality set to " .. quality)
        menu:Close()
    end)

    menu:addRange("fov", "Field of View", 60, 120, 90, function(value)
        Notification.Success("Graphics", "Field of View set to " .. value)
    end)

    menu:addCheckbox("vsync", "V-Sync", true, function(enabled)
        Notification.Success("Graphics", "V-Sync " .. (enabled and "enabled" or "disabled"))
    end)

    menu:addText("audio-label", "Audio Settings")
    menu:addRange("master-volume", "Master Volume", 0, 100, 80, function(value)
        Notification.Success("Audio", "Master Volume set to " .. value)
    end)

    menu:addCheckbox("subtitles", "Enable Subtitles", false, function(enabled)
        Notification.Success("Audio", "Subtitles " .. (enabled and "enabled" or "disabled"))
        menu:Close()
    end)

    menu:addText("controls-label", "Controls")
    menu:addRange("sensitivity", "Mouse Sensitivity", 1, 100, 50, function(value)
        Notification.Success("Controls", "Mouse Sensitivity set to " .. value)
    end)

    menu:addButton("apply", "Close Menu", function()
        menu:Close()
    end)

    menu:Open(true, true)
end

function ShowMenu()
    local menu = ContextMenu.new()

    menu:SetHeader("Shell Preview")
    menu:setMenuInfo("Menu", "Shells preview")


    menu:addButton("apply", "Shell 1", function()
        menu:Close()
    end)

    menu:Open(true, true)
end

function Showcase:CreateDoorInteraction()
    Interaction.Create("door-interaction", {
        text = "Open Door",
        key = "E",
        duration = 2000,
        onComplete = function()
            Notification.Info("Door", "Door opened")
        end,
        onCancel = function()
            Notification.Warning("Door", "Opening cancelled")
        end
    })
end

function Showcase:ClearAllInteractions()
    Interaction.Clear()
    Notification.Info("Interactions", "All interactions cleared")
end

function Showcase:ConfirmQuit()
    local qm = QuickMenus.new()
    qm:ShowConfirm("Quit Game?", "Are you sure you want to quit?",
        function()
            -- Game.Quit()
            Notification.Info("Game", "Quit confirmed")
            qm:CloseConfirm()
        end,
        function()
            qm:CloseConfirm()
            Notification.Info("Game", "Quit cancelled")
        end
    )
end

function Showcase:ShowMapVoting()
    local menu = SelectMenu.new()
    menu:SetTitle("Vote for Next Map")

    local maps = {
        { id = "dust", name = "Dust Valley",   image = "./media/gm1.png" },
        { id = "snow", name = "Snow Peak",     image = "./media/gm2.png" },
        { id = "city", name = "Urban Warfare", image = "./media/gm3.png" }
    }

    for _, map in ipairs(maps) do
        menu:addOption(map.id, map.name, map.image,
            "Vote for " .. map.name .. " as the next map",
            {
                { name = "size",    value = "Large", icon = "./media/icon1.svg" },
                { name = "players", value = "32",    icon = "./media/icon2.svg" }
            },
            function()
                menu:Close()
            end
        )
    end

    menu:Open()
end

function Showcase:Notification()
    Notification.Info("Showcase", "This is a notification")
    Notification.Warning("Showcase", "This is a warning")
    Notification.Error("Showcase", "This is an error")
end

function Showcase:QuickInput()
    local qm = QuickMenus.new()
    qm:ShowInput("Enter Name", "Type your name here...",
        function(value)
            qm:CloseInput()
            Notification.Success("Name Set", "Your name is now " .. value)
        end,
        function()
            qm:CloseInput()
        end
    )
end

local context_trigger = Trigger(
    Vector(1270.0, -200.0, 100),
    Rotator(),
    Vector(100),
    TriggerType.Sphere,
    true,
    function(self, other) Showcase:ShowSettingsMenu() end,
    Color(1, 0, 0, 0.5)
)

local select_trigger = Trigger( -- select trigger
    Vector(1270.0, 530.0, 100),
    Rotator(),
    Vector(100),
    TriggerType.Sphere,
    true,
    function(self, other) Showcase:ShowMapVoting() end,
    Color(1, 0, 0, 0.5)
)

local quickConfirm_trigger = Trigger( -- select trigger
    Vector(870.0, 960.0, 100),
    Rotator(),
    Vector(100),
    TriggerType.Sphere,
    true,
    function(self, other) Showcase:ConfirmQuit() end,
    Color(1, 0, 0, 0.5)
)

local interaction_trigger = Trigger( -- select trigger
    Vector(120.0, 960.0, 100),
    Rotator(),
    Vector(100),
    TriggerType.Sphere,
    true,
    function(self, other) Showcase:CreateDoorInteraction() end,
    Color(1, 0, 0, 0.5)
)

local notif_trigger = Trigger( -- select trigger
    Vector(220.0, -520.0, 100.0),
    Rotator(),
    Vector(100),
    TriggerType.Sphere,
    true,
    function(self, other) Showcase:Notification() end,
    Color(1, 0, 0, 0.5)
)

local quickInput_trigger = Trigger(
    Vector(830.0, -520.0, 100.0),
    Rotator(),
    Vector(100),
    TriggerType.Sphere,
    true,
    function(self, other) Showcase:QuickInput() end,
    Color(1, 0, 0, 0.5)
)

function Showcase:ShowProgressBar(style)
    ProgressBar.Create("demo-bar", {
        text = "Calibrating...",
        duration = 5000,
        position = "bottom-center",
        style = style,
        onComplete = function()
            Notification.Success("Progress", "Calibration Complete")
        end
    })
end

function Showcase:StartSkillCheck(difficulty)
    SkillCheck.Create("demo-check", {
        key = "E",
        difficulty = difficulty,
        retries = 3,
        onSuccess = function()
            Notification.Success("Skill Check", "Hack Successful")
        end,
        onFail = function()
            Notification.Error("Skill Check", "Hack Failed")
        end
    })
end

local pb_trigger_style_helix = Trigger(
    Vector(-681.479701, 935.06544, 91.649999),
    Rotator(),
    Vector(100),
    TriggerType.Sphere,
    true,
    function(self, other) Showcase:ShowProgressBar("helix") end,
    Color(0, 0, 1, 0.5)
)

local pb_trigger_style_horizontal = Trigger(
    Vector(-921.553119, 940.399655, 91.649999),
    Rotator(),
    Vector(100),
    TriggerType.Sphere,
    true,
    function(self, other) Showcase:ShowProgressBar("horizontal") end,
    Color(0, 0, 1, 0.5)
)

local sc_trigger_easy = Trigger(
    Vector(-1255.812497, 960.553291, 91.65),
    Rotator(),
    Vector(100),
    TriggerType.Sphere,
    true,
    function(self, other) Showcase:StartSkillCheck(1) end,
    Color(1, 1, 0, 0.5)
)

local sc_trigger_medium = Trigger(
    Vector(-1539.652336, 980.752641, 91.65),
    Rotator(),
    Vector(100),
    TriggerType.Sphere,
    true,
    function(self, other) Showcase:StartSkillCheck(2) end,
    Color(1, 1, 0, 0.5)
)

local sc_trigger_hard = Trigger(
    Vector(-1785.270581, 980.752641, 91.65),
    Rotator(),
    Vector(100),
    TriggerType.Sphere,
    true,
    function(self, other) Showcase:StartSkillCheck(3) end,
    Color(1, 1, 0, 0.5)
)
