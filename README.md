# Core-UI System Documentation

Core-UI is a comprehensive user interface system for HELIX that provides ready-to-use UI components including context menus, notifications, interactions, quick dialogs, and selection menus. All components are built with WebUI and feature modern, responsive designs with smooth animations.

## Overview

The Core-UI system consists of five main modules:

- **Context Menu** - A versatile menu system with support for various input types
- **Notification System** - Toast-style notifications with different types and animations
- **Interaction System** - Hold-to-interact UI prompts with progress bars
- **Quick Menus** - Simple input and confirmation dialogs
- **Select Menu** - Advanced selection menu with image previews and pagination

### HELIX World ID: `core-ui-world.lix`

## Context Menu System

The Context Menu provides a flexible menu interface with support for multiple input types including buttons, checkboxes, text inputs, sliders, color pickers, and more.

### Basic Usage

```lua
-- Create a new context menu
local menu = ContextMenu.new()

-- Add a button
menu:addButton("btn-id", "Click Me", function()
    print("Button clicked!")
end)

-- Add a checkbox
menu:addCheckbox("check-id", "Enable Feature", true, function(checked)
    print("Checkbox state:", checked)
end)

-- Open the menu
menu:Open(true, true) -- enableMouse, freezePlayer
```

### Available Elements

#### addButton(id, text, callback)
Adds a clickable button to the menu.

```lua
menu:addButton("start-game", "Start Game", function()
    -- Start game logic
end)
```

#### addCheckbox(id, text, defaultValue, callback)
Adds a checkbox with a boolean state.

```lua
menu:addCheckbox("music-enabled", "Enable Music", true, function(checked)
    -- Sound.SetMasterVolume(checked and 1.0 or 0.0) -- your code here
end)
```

#### addRange(id, text, min, max, defaultValue, callback)
Adds a slider for numeric values.

```lua
menu:addRange("volume", "Volume", 0, 100, 50, function(value)
    -- Sound.SetMasterVolume(value / 100) -- your code here
end)
```

#### addTextInput(id, text, callback)
Adds a text input field.

```lua
menu:addTextInput("player-name", "Enter Name", function(text)
    -- Player.SetName(text) -- your code here
end)
```

#### addPassword(id, text, placeholder, callback)
Adds a password input field with masked characters.

```lua
menu:addPassword("password", "Password", "Enter password", function(password)
    -- Handle password
end)
```

#### addNumber(id, text, defaultValue, callback)
Adds a numeric input field.

```lua
menu:addNumber("age", "Your Age", 18, function(value)
    -- Player.SetAge(value) -- your code here
end)
```

#### addColorPicker(id, text, defaultColor, callback)
Adds a color picker.

```lua
menu:addColorPicker("theme-color", "Choose Color", "#ff0000", function(color)
    -- UI.SetThemeColor(color) -- your code here
end)
```

#### addDatePicker(id, text, defaultDate, callback)
Adds a date picker.

```lua
menu:addDatePicker("birth-date", "Select Date", "2000-01-01", function(date)
    Player.SetBirthDate(date) -- your code here
end)
```

#### addRadio(id, text, options, callback)
Adds a radio button group.

```lua
menu:addRadio("difficulty", "Difficulty", {
    { value = "easy", text = "Easy", checked = false },
    { value = "normal", text = "Normal", checked = true },
    { value = "hard", text = "Hard", checked = false }
}, function(selected)
    -- Game.SetDifficulty(selected) -- your code here
end)
```

#### addSelect(id, text, options, callback)
Adds a dropdown select menu.

```lua
menu:addSelect("region", "Server Region", {
    { value = "us-east", text = "US East", selected = true },
    { value = "us-west", text = "US West" },
    { value = "europe", text = "Europe" }
}, function(selected)
    -- Network.SetRegion(selected) -- your code here
end)
```

#### addListPicker(id, text, items, callback)
Adds a list picker for selecting from multiple items.

```lua
menu:addListPicker("weapon", "Choose Weapon", {
    { id = "sword", label = "Iron Sword" },
    { id = "bow", label = "Elven Bow" },
    { id = "staff", label = "Magic Staff" }
}, function(weapon)
    -- Player.EquipWeapon(weapon.id) -- your code here
end)
```

#### addText(id, text)
Adds a simple text display element.

```lua
menu:addText("info", "This is informational text")
```

### Menu Configuration

#### SetHeader(text)
Sets the menu header text.

```lua
menu:SetHeader("Game Settings")
```

#### setMenuInfo(title, description)
Sets the menu title and description.

```lua
menu:setMenuInfo("Settings", "Configure your game preferences")
```

### Menu Control

#### Open(enableMouse, freezePlayer)
Opens the menu with optional mouse and player control settings.

```lua
menu:Open(true, true) -- Enable mouse, freeze player movement
```

#### Close()
Closes the menu and restores controls.

```lua
menu:Close()
```

## Notification System

The Notification system displays toast-style notifications with support for different types, custom durations, and stacking.

### Basic Usage

```lua
-- Send a simple notification
Notification.Send("success", "Welcome!", "Game loaded successfully", 3000)

-- Or use convenience methods
Notification.Success("Success", "Operation completed!")
Notification.Error("Error", "Something went wrong")
Notification.Warning("Warning", "Low health")
Notification.Info("Info", "New update available")
```

### Methods

#### Send(type, title, message, duration)
Sends a notification with specified parameters.

- `type` - Notification type: "success", "error", "warning", "info"
- `title` - Notification title
- `message` - Notification message
- `duration` - Display duration in milliseconds (default: 3000)

```lua
local id = Notification.Send("success", "Achievement", "You reached level 10!", 5000)
```

#### Remove(id)
Removes a specific notification by ID.

```lua
local id = Notification.Send("info", "Loading", "Please wait...")
-- Later...
Notification.Remove(id)
```

#### Clear()
Clears all active notifications.

```lua
Notification.Clear()
```

### Convenience Methods

```lua
Notification.Success(title, message, duration)
Notification.Error(title, message, duration)
Notification.Warning(title, message, duration)
Notification.Info(title, message, duration)
```

## Interaction System

The Interaction system provides hold-to-interact UI prompts commonly used for interactive objects in games.

### Basic Usage

```lua
-- Create an interaction
Interaction.Create("door-interaction", {
    text = "Open Door",
    key = "E",
    duration = 2000,
    onComplete = function()
        print("Door opened!")
    end,
    onCancel = function()
        print("Interaction cancelled")
    end
})

-- Remove an interaction
Interaction.Remove("door-interaction")
```

### Parameters

- `text` - The interaction prompt text
- `key` - The key to hold for interaction
- `duration` - Time in milliseconds to complete the interaction
- `onComplete` - Callback when interaction completes
- `onCancel` - Callback when interaction is cancelled

### Multiple Interactions

The system supports multiple simultaneous interactions:

```lua
Interaction.Create("pickup-item", {
    text = "Pick up item",
    key = "F",
    duration = 1000,
    onComplete = function()
        -- Pick up logic
    end
})

Interaction.Create("enter-vehicle", {
    text = "Enter vehicle",
    key = "G",
    duration = 1500,
    onComplete = function()
        -- Enter vehicle logic
    end
})
```

## Quick Menus System

Quick Menus provide simple input and confirmation dialogs for quick user interactions.

### Input Dialog

```lua
local qm = QuickMenus.new()
qm:ShowInput("Enter your name:", "Type name here...",
    function(value)
        print("User entered:", value)
    end,
    function()
        print("Input cancelled")
    end
)
```

### Confirmation Dialog

```lua
local qm = QuickMenus.new()
qm:ShowConfirm("Delete Save?", "This action cannot be undone.",
    function()
        print("User confirmed")
        -- Delete save logic
    end,
    function()
        print("User cancelled")
    end
)
```

### Methods

#### ShowInput(title, placeholder, callback, callback_cancel)
Shows an input dialog.

- `title` - Dialog title
- `placeholder` - Input placeholder text
- `callback` - Called with input value when confirmed
- `callback_cancel` - Called when cancelled

#### ShowConfirm(title, message, callback_yes, callback_no)
Shows a confirmation dialog.

- `title` - Dialog title
- `message` - Confirmation message
- `callback_yes` - Called when user confirms
- `callback_no` - Called when user cancels

## Select Menu System

The Select Menu provides an advanced selection interface with image previews, descriptions, and pagination support.

### Basic Usage

```lua
local menu = SelectMenu.new()

menu:SetTitle("Select Game Mode")

menu:addOption("tdm", "Team Deathmatch", "./images/tdm.png",
    "Classic team-based combat mode",
    {
        { name = "players", value = "8-16", icon = "./icons/players.svg" },
        { name = "time", value = "15 min", icon = "./icons/time.svg" }
    },
    function()
        Game.LoadMode("tdm")
    end
)

menu:addOption("ctf", "Capture the Flag", "./images/ctf.png",
    "Capture the enemy flag and defend your own",
    {
        { name = "players", value = "10-20", icon = "./icons/players.svg" },
        { name = "time", value = "20 min", icon = "./icons/time.svg" }
    },
    function()
        Game.LoadMode("ctf")
    end
)

menu:Open()
```

### Methods

#### addOption(id, name, image, description, info, callback)
Adds an option to the menu.

- `id` - Unique identifier for the option
- `name` - Display name
- `image` - Path to preview image
- `description` - Detailed description
- `info` - Table of info items with `name`, `value`, and `icon`
- `callback` - Function called when option is selected

#### SetTitle(title)
Sets the menu title.

```lua
menu:SetTitle("Choose Your Character")
```

#### Open()
Opens the select menu.

```lua
menu:Open()
```

#### Close()
Closes the select menu.

```lua
menu:Close()
```

### Features

- **Image Previews** - Each option can display a preview image
- **Detailed Info** - Show additional information with icons
- **Pagination** - Automatic pagination for more than 6 options
- **Keyboard Navigation** - Navigate with arrow keys, select with Enter
- **Smooth Animations** - Fluid transitions and hover effects

## Complete Example

Here's a complete example showing all Core-UI systems in action:

```lua
-- Context Menu Example
function ShowSettingsMenu()
    local menu = ContextMenu.new()

    menu:SetHeader("GAME SETTINGS")
    menu:setMenuInfo("Settings", "Configure your game preferences")

    -- Graphics settings
    menu:addText("graphics-label", "Graphics Settings")
    menu:addSelect("quality", "Graphics Quality", {
        { value = "low", text = "Low" },
        { value = "medium", text = "Medium" },
        { value = "high", text = "High", selected = true },
        { value = "ultra", text = "Ultra" }
    }, function(quality)
        Graphics.SetQuality(quality)
        Notification.Success("Graphics", "Quality set to " .. quality)
    end)

    menu:addRange("fov", "Field of View", 60, 120, 90, function(value)
        Camera.SetFOV(value)
    end)

    menu:addCheckbox("vsync", "V-Sync", true, function(enabled)
        Graphics.SetVSync(enabled)
    end)

    -- Audio settings
    menu:addText("audio-label", "Audio Settings")
    menu:addRange("master-volume", "Master Volume", 0, 100, 80, function(value)
        Audio.SetMasterVolume(value / 100)
    end)

    menu:addCheckbox("subtitles", "Enable Subtitles", false, function(enabled)
        UI.SetSubtitles(enabled)
    end)

    -- Controls
    menu:addText("controls-label", "Controls")
    menu:addRange("sensitivity", "Mouse Sensitivity", 1, 100, 50, function(value)
        Input.SetSensitivity(value / 100)
    end)

    -- Apply button
    menu:addButton("apply", "Apply Settings", function()
        Notification.Success("Settings", "All settings have been applied")
        menu:Close()
    end)

    menu:Open(true, true)
end

-- Interaction Example
function CreateDoorInteraction(door)
    Interaction.Create("door-" .. door:GetID(), {
        text = "Open Door",
        key = "E",
        duration = 2000,
        onComplete = function()
            door:Open()
            Notification.Info("Door", "Door opened")
        end,
        onCancel = function()
            Notification.Warning("Door", "Opening cancelled")
        end
    })
end

-- Quick Menu Example
function ConfirmQuit()
    local qm = QuickMenus.new()
    qm:ShowConfirm("Quit Game?", "Are you sure you want to quit?",
        function()
            -- Game.Quit() -- quit logic here
        end,
        function()
            Notification.Info("Game", "Quit cancelled")
        end
    )
end

-- Select Menu Example
function ShowMapVoting()
    local menu = SelectMenu.new()
    menu:SetTitle("Vote for Next Map")

    local maps = {
        { id = "dust", name = "Dust Valley", image = "./maps/dust.jpg" },
        { id = "snow", name = "Snow Peak", image = "./maps/snow.jpg" },
        { id = "city", name = "Urban Warfare", image = "./maps/city.jpg" }
    }

    for _, map in ipairs(maps) do
        menu:addOption(map.id, map.name, map.image,
            "Vote for " .. map.name .. " as the next map",
            {
                { name = "size", value = "Large", icon = "./icons/size.svg" },
                { name = "players", value = "32", icon = "./icons/players.svg" }
            },
            function()
                Notification.Success("Vote", "You voted for " .. map.name)
                menu:Close()
            end
        )
    end

    menu:Open()
end
```

## Performance Considerations

- **UI Initialization** - All UI components initialize with a 500ms delay to ensure proper loading
- **Pending Queues** - Systems use pending queues to handle early calls before UI is ready
- **Single Instance** - Most systems maintain single instances to prevent memory leaks
- **Cleanup** - Always call destroy methods when unloading to properly clean up WebUI instances

## License

Core-UI is part of the HELIX framework and follows the same licensing terms.
