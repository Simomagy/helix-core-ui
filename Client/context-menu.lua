local ContextMenu = {}
ContextMenu.__index = ContextMenu
ContextMenu.currentInstance = nil
ContextMenu.focusIndex = 1
ContextMenu.UI = WebUI("ContextMenu", "core-ui/Client/ui/context-menu/index.html")
ContextMenu.UIReady = false
ContextMenu.isVisible = false

ContextMenu.UI:RegisterEventHandler('ExecuteCallback', function(data)
    if data and data.id and ContextMenu.currentInstance then
        ContextMenu.currentInstance:executeCallback(data.id, data.params)
    end
end)

ContextMenu.UI:RegisterEventHandler('CloseMenu', function(data)
    if ContextMenu.currentInstance then
        ContextMenu.currentInstance:Close()
    end
end)

ContextMenu.UI:RegisterEventHandler('Ready', function()
    ContextMenu.UIReady = true
end)

function ContextMenu.Show()
    if ContextMenu.isVisible then return end
    ContextMenu.isVisible = true
end

function ContextMenu.Hide()
    if not ContextMenu.isVisible then return end
    ContextMenu.isVisible = false
end

function ContextMenu.new()
    local self = setmetatable({}, ContextMenu)
    self.items = {}
    ContextMenu.currentInstance = self

    return self
end

function ContextMenu:addButton(id, text, callback)
    table.insert(self.items, {
        id = id,
        type = "button",
        text = text,
        callback = callback
    })
end

function ContextMenu:addCheckbox(id, label, checked, callback)
    checked = checked or false
    table.insert(self.items, {
        id = id,
        type = "checkbox",
        label = label,
        checked = checked,
        callback = callback
    })
end

function ContextMenu:addDropdown(id, label, options, callback)
    local dropdownOptions = {}
    for _, item in ipairs(options) do
        local newItem = {}
        for k, v in pairs(item) do
            newItem[k] = v
        end

        if newItem.type == "dropdown" and newItem.options then
            newItem.options = {}
            for _, subItem in ipairs(item.options) do
                local newSubItem = {}
                for k, v in pairs(subItem) do
                    newSubItem[k] = v
                end
                table.insert(newItem.options, newSubItem)
            end
        end

        table.insert(dropdownOptions, newItem)
    end

    table.insert(self.items, {
        id       = id,
        label    = label,
        type     = "dropdown",
        options  = dropdownOptions,
        callback = callback
    })
end

function ContextMenu:addRange(id, label, min, max, value, callback)
    min = min or 0
    max = max or 100
    value = value or min
    table.insert(self.items, {
        id = id,
        type = "range",
        label = label,
        min = min,
        max = max,
        value = value,
        callback = callback
    })
end

function ContextMenu:addTextInput(id, text, callback)
    table.insert(self.items, {
        id = id,
        type = "text-input",
        label = text,
        callback = callback
    })
end

function ContextMenu:addPassword(id, label, placeholder, callback)
    placeholder = placeholder or ""
    table.insert(self.items, {
        id = id,
        type = "password",
        label = label,
        placeholder = placeholder,
        callback = callback
    })
end

function ContextMenu:addRadio(id, label, radioOptions, callback)
    table.insert(self.items, {
        id = id,
        type = "radio",
        label = label,
        options = radioOptions,
        callback = callback
    })
end

function ContextMenu:addNumber(id, label, defaultValue, callback)
    defaultValue = defaultValue or 0
    table.insert(self.items, {
        id = id,
        type = "number",
        label = label,
        value = defaultValue,
        callback = callback
    })
end

function ContextMenu:addSelect(id, label, selectOptions, callback)
    table.insert(self.items, {
        id = id,
        type = "select",
        label = label,
        options = selectOptions,
        callback = callback
    })
end

function ContextMenu:addText(id, data)
    local is_list = false
    if type(data) == "table" then
        is_list = true
    end

    table.insert(self.items, {
        id = id,
        type = "text-display",
        data = data,
        is_list = is_list
    })
end

function ContextMenu:addColorPicker(id, label, defaultColor, callback)
    defaultColor = defaultColor or "#ffffff"
    table.insert(self.items, {
        id = id,
        type = "color",
        label = label,
        value = defaultColor,
        callback = callback
    })
end

function ContextMenu:addDatePicker(id, label, defaultDate, callback)
    defaultDate = defaultDate or "2024-01-01"
    table.insert(self.items, {
        id = id,
        type = "date",
        label = label,
        value = defaultDate,
        callback = callback
    })
end

function ContextMenu:addListPicker(id, label, items, callback)
    table.insert(self.items, {
        id = id,
        type = "list-picker",
        label = label,
        list = items,
        callback = callback
    })
end

function ContextMenu:getItems()
    return self.items
end

function ContextMenu:SendNotification(title, text, time, position, color)
    if ContextMenu.UI then
        ContextMenu.UI:SendEvent("ShowNotification", {
            title = title,
            message = text,
            duration = time,
            pos = position,
            color = color
        })
    end
end

function ContextMenu:Open(disable_game_input, enable_mouse)
    ContextMenu.currentInstance = self
    self.isOpen = true

    if not ContextMenu.UIReady then
        Timer.SetTimeout(function()
            self:Open(disable_game_input, enable_mouse)
        end, 100)
        return
    end

    if ContextMenu.UI then
        local items = self:getItems()

        ContextMenu.UI:SendEvent("ClearMenuItems")

        for i, item in ipairs(items) do
            ContextMenu.UI:SendEvent("AddMenuItem", item)
        end

        ContextMenu.UI:SendEvent("BuildMenu")

        if self.Header then
            ContextMenu.UI:SendEvent("SetHeader", { header = self.Header })
        end

        if self.MenuTitle or self.MenuDescription then
            ContextMenu.UI:SendEvent("SetMenuInfo", { title = self.MenuTitle or "", description = self.MenuDescription or "" })
        end

        ContextMenu.UI:SetInputMode(1)
        ContextMenu.UI:BringToFront()
        ContextMenu.Show()
    end
end

function ContextMenu:setMenuInfo(title, description)
    self.MenuTitle = title
    self.MenuDescription = description

    if ContextMenu.UI then
        ContextMenu.UI:SendEvent("SetMenuInfo", { title = title or "", description = description or "" })
    end
end

function ContextMenu:SetHeader(title)
    self.Header = title
    if ContextMenu.UI then
        ContextMenu.UI:SendEvent("SetHeader", { header = title })
    end
end

function ContextMenu:getFlattenedItems()
    local results = {}
    local function traverse(items)
        for _, item in ipairs(items) do
            table.insert(results, item)

            if item.type == "dropdown" and item.expanded and item.options then
                traverse(item.options)
            end
        end
    end
    traverse(self.items)
    return results
end

function ContextMenu:focusNext()
    local flattened = self:getFlattenedItems()
    if #flattened < 1 then return end
    self.focusIndex = self.focusIndex + 1
    if self.focusIndex > #flattened then
        self.focusIndex = #flattened
    end
    self:focusItem(flattened[self.focusIndex])
end

function ContextMenu:focusPrevious()
    local flattened = self:getFlattenedItems()
    if #flattened < 1 then return end
    self.focusIndex = self.focusIndex - 1
    if self.focusIndex < 1 then
        self.focusIndex = 1
    end
    self:focusItem(flattened[self.focusIndex])
end

function ContextMenu:expandFocused()
    local flattened = self:getFlattenedItems()
    local current = flattened[self.focusIndex]
    if not current or current.type ~= "dropdown" then return end
    current.expanded = true
    self:refreshMenu()
end

function ContextMenu:collapseFocused()
    local flattened = self:getFlattenedItems()
    local current = flattened[self.focusIndex]
    if not current or current.type ~= "dropdown" or not current.expanded then return end
    current.expanded = false
    self:refreshMenu()
end

function ContextMenu:focusItem(item)
    if not item or not ContextMenu.UI then return end
    ContextMenu.UI:SendEvent("FocusOptionById", { id = item.id })
end

function ContextMenu:refreshMenu()
    if ContextMenu.UI then
        ContextMenu.UI:SendEvent("BuildContextMenu", { items = self.items })
        local flattened = self:getFlattenedItems()
        if self.focusIndex > #flattened then
            self.focusIndex = #flattened
        end
        if flattened[self.focusIndex] then
            self:focusItem(flattened[self.focusIndex])
        end
    end
end

function ContextMenu:setInitialFocus()
    self.focusIndex = 1
    local flattened = self:getFlattenedItems()
    if #flattened > 0 then
        self:focusItem(flattened[self.focusIndex])
    end
end

function ContextMenu:Close()
    self.isOpen = false
    if ContextMenu.UI then
        ContextMenu.UI:SetInputMode(0)
        ContextMenu.UI:SendEvent("CloseContextMenu")
        ContextMenu.Hide()
    end
end

function ContextMenu:executeCallback(id, params)
    for _, item in ipairs(self.items) do
        if item.id == id then
            local is_valid, err_msg = self:validateInput(item, params)
            if not is_valid then
                self:ShowError(err_msg)
                return
            end
            if item.callback then
                item.callback(params)
            end
            return
        end

        if item.options then
            for _, option in ipairs(item.options) do
                if option.id == id then
                    local is_valid, err_msg = self:validateInput(option, params)
                    if not is_valid then
                        self:ShowError(err_msg)
                        return
                    end
                    if option.callback then
                        option.callback(params)
                    end
                    return
                end
            end
        end
    end
end

function ContextMenu:validateInput(item, params)
    if item.type == "text-input" then
        if type(params) ~= "string" or params == "" then
            return false, "Input cannot be empty."
        end
        if #params > 50 then
            return false, "Input is too long."
        end
    end

    if item.type == "number" then
        local val = tonumber(params)
        if not val then
            return false, "Value must be a number."
        end
        if (item.min and val < item.min) or (item.max and val > item.max) then
            return false, "Value is out of the allowed range."
        end
    end

    if item.type == "password" then
        if type(params) ~= "string" or #params < 4 then
            return false, "Password is too short."
        end
        if not string.match(params, "%d") then
            return false, "Password must contain at least one digit."
        end
    end

    if item.type == "checkbox" then
        if type(params) ~= "boolean" then
            return false, "Invalid checkbox state."
        end
    end

    if item.type == "radio" and item.options then
        local found = false
        for _, opt in ipairs(item.options) do
            if opt.value == params then
                found = true
                break
            end
        end
        if not found then
            return false, "Invalid radio selection."
        end
    end

    if item.type == "select" and item.options then
        local found = false
        for _, opt in ipairs(item.options) do
            if opt.value == params then
                found = true
                break
            end
        end
        if not found then
            return false, "Invalid selection."
        end
    end

    if item.type == "dropdown" and item.options then
        local found = false
        for _, opt in ipairs(item.options) do
            if opt.id == params or opt.label == params then
                found = true
                break
            end
        end
        if not found then
            return false, "Invalid dropdown choice."
        end
    end

    if item.type == "range" then
        local val = tonumber(params)
        if not val then
            return false, "Value must be a number."
        end
        if (item.min and val < item.min) or (item.max and val > item.max) then
            return false, "Value is out of range."
        end
    end

    return true
end

function ContextMenu:ShowError(message)
    if Notification and Notification.Send then
        Notification.Send("error", "Invalid Input", message)
    end
end

function ContextMenu:enterOrEdit()
    local flattened = self:getFlattenedItems()
    if #flattened < 1 then return end
    local current = flattened[self.focusIndex]
    if not current then return end

    if current.type == "range" or current.type == "number" or current.type == "text-input" then
        self.editMode = true
    elseif current.type == "dropdown" then
        if not current.expanded then
            current.expanded = true
            self:refreshMenu()
        else
            if ContextMenu.UI then
                ContextMenu.UI:SendEvent("SelectFocusedOption")
            end
        end
    else
        if ContextMenu.UI then
            ContextMenu.UI:SendEvent("SelectFocusedOption")
        end
    end
end

function ContextMenu:adjustCurrentOptionValue(keyName)
    local flattened = self:getFlattenedItems()
    local current = flattened[self.focusIndex]
    if not current then return end

    if current.type == "range" or current.type == "number" then
        local step = 1
        if keyName == "ArrowLeft" then
            current.value = math.max(current.min or 0, current.value - step)
        else
            current.value = math.min(current.max or 100, current.value + step)
        end
        if current.callback then
            current.callback(current.value)
        end
        self:refreshMenu()
    end
end

function ContextMenu_CloseMenu()
    if ContextMenu.currentInstance then
        ContextMenu.currentInstance:Close()
    end
end

function ContextMenu_ExecuteCallback(id, params)
    if ContextMenu.currentInstance then
        ContextMenu.currentInstance:executeCallback(id, params)
    end
end

function ContextMenu.Destroy()
    if ContextMenu.currentInstance then
        ContextMenu.currentInstance:Close()
    end

    if ContextMenu.UI then
        ContextMenu.UI:Destroy()
        ContextMenu.UI = nil
        ContextMenu.UIReady = false
        ContextMenu.isVisible = false
    end

    ContextMenu.currentInstance = nil
end

_G.ContextMenu = ContextMenu

function onShutdown()
    ContextMenu.Destroy()
end
