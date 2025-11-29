local SideMenu = {}
SideMenu.__index = SideMenu
SideMenu.currentInstance = nil
SideMenu.UI = WebUI("SideMenu", "core-ui/Client/ui/side-menu/index.html")
SideMenu.UIReady = false
SideMenu.isVisible = false

SideMenu.UI:RegisterEventHandler('ExecuteCallback', function(data)
    if data and data.id and SideMenu.currentInstance then
        SideMenu.currentInstance:executeCallback(data.id, data.params)
    end
end)

SideMenu.UI:RegisterEventHandler('CloseMenu', function(data)
    if SideMenu.currentInstance then
        SideMenu.currentInstance:Close()
    end
end)

SideMenu.UI:RegisterEventHandler('Ready', function()
    SideMenu.UIReady = true
end)

function SideMenu.Show()
    if SideMenu.isVisible then return end
    SideMenu.isVisible = true
end

function SideMenu.Hide()
    if not SideMenu.isVisible then return end
    SideMenu.isVisible = false
end

function SideMenu.new()
    local self = setmetatable({}, SideMenu)
    self.items = {}
    SideMenu.currentInstance = self

    return self
end

function SideMenu:addButton(id, text, callback)
    table.insert(self.items, {
        id = id,
        type = "button",
        text = text,
        callback = callback
    })
end

function SideMenu:addCheckbox(id, label, checked, callback)
    checked = checked or false
    table.insert(self.items, {
        id = id,
        type = "checkbox",
        label = label,
        checked = checked,
        callback = callback
    })
end

function SideMenu:addDropdown(id, label, options, callback)
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

function SideMenu:addRange(id, label, min, max, value, callback)
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

function SideMenu:addTextInput(id, text, callback)
    table.insert(self.items, {
        id = id,
        type = "text-input",
        label = text,
        callback = callback
    })
end

function SideMenu:addPassword(id, label, placeholder, callback)
    placeholder = placeholder or ""
    table.insert(self.items, {
        id = id,
        type = "password",
        label = label,
        placeholder = placeholder,
        callback = callback
    })
end

function SideMenu:addRadio(id, label, radioOptions, callback)
    table.insert(self.items, {
        id = id,
        type = "radio",
        label = label,
        options = radioOptions,
        callback = callback
    })
end

function SideMenu:addNumber(id, label, defaultValue, callback)
    defaultValue = defaultValue or 0
    table.insert(self.items, {
        id = id,
        type = "number",
        label = label,
        value = defaultValue,
        callback = callback
    })
end

function SideMenu:addSelect(id, label, selectOptions, callback)
    table.insert(self.items, {
        id = id,
        type = "select",
        label = label,
        options = selectOptions,
        callback = callback
    })
end

function SideMenu:addText(id, data)
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

function SideMenu:addColorPicker(id, label, defaultColor, callback)
    defaultColor = defaultColor or "#ffffff"
    table.insert(self.items, {
        id = id,
        type = "color",
        label = label,
        value = defaultColor,
        callback = callback
    })
end

function SideMenu:addDatePicker(id, label, defaultDate, callback)
    defaultDate = defaultDate or "2024-01-01"
    table.insert(self.items, {
        id = id,
        type = "date",
        label = label,
        value = defaultDate,
        callback = callback
    })
end

function SideMenu:addListPicker(id, label, items, callback)
    table.insert(self.items, {
        id = id,
        type = "list-picker",
        label = label,
        list = items,
        callback = callback
    })
end

function SideMenu:getItems()
    return self.items
end

function SideMenu:SendNotification(title, text, time, position, color)
    if SideMenu.UI then
        SideMenu.UI:SendEvent("ShowNotification", {
            title = title,
            message = text,
            duration = time,
            pos = position,
            color = color
        })
    end
end

function SideMenu:Open(disable_game_input, enable_mouse)
    SideMenu.currentInstance = self
    self.isOpen = true

    if not SideMenu.UIReady then
        Timer.SetTimeout(function()
            self:Open(disable_game_input, enable_mouse)
        end, 100)
        return
    end

    if SideMenu.UI then
        local items = self:getItems()

        SideMenu.UI:SendEvent("ClearMenuItems")

        for i, item in ipairs(items) do
            SideMenu.UI:SendEvent("AddMenuItem", item)
        end

        SideMenu.UI:SendEvent("BuildMenu")

        if self.Header then
            SideMenu.UI:SendEvent("SetHeader", { header = self.Header })
        end

        if self.MenuTitle or self.MenuDescription then
            SideMenu.UI:SendEvent("SetMenuInfo", { title = self.MenuTitle or "", description = self.MenuDescription or "" })
        end

        SideMenu.UI:SetInputMode(1)
        SideMenu.UI:BringToFront()
        SideMenu.Show()
    end
end

function SideMenu:setMenuInfo(title, description)
    self.MenuTitle = title
    self.MenuDescription = description

    if SideMenu.UI then
        SideMenu.UI:SendEvent("SetMenuInfo", { title = title or "", description = description or "" })
    end
end

function SideMenu:SetHeader(title)
    self.Header = title
    if SideMenu.UI then
        SideMenu.UI:SendEvent("SetHeader", { header = title })
    end
end

function SideMenu:Close()
    self.isOpen = false
    if SideMenu.UI then
        SideMenu.UI:SetInputMode(0)
        SideMenu.UI:SendEvent("CloseMenu")
        SideMenu.Hide()
    end
end

function SideMenu:executeCallback(id, params)
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

function SideMenu:validateInput(item, params)
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

function SideMenu:ShowError(message)
    if Notification and Notification.Send then
        Notification.Send("error", "Invalid Input", message)
    end
end

function SideMenu.Destroy()
    if SideMenu.currentInstance then
        SideMenu.currentInstance:Close()
    end

    if SideMenu.UI then
        SideMenu.UI:Destroy()
        SideMenu.UI = nil
        SideMenu.UIReady = false
        SideMenu.isVisible = false
    end

    SideMenu.currentInstance = nil
end

_G.SideMenu = SideMenu

function onShutdown()
    SideMenu.Destroy()
end

