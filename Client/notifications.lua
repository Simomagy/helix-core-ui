Notification = {}
Notification.__index = Notification
Notification.UI = WebUI("NotificationUI", "core-ui/Client/ui/notification/index.html")
Notification.UIReady = false
Notification.isVisible = false
Notification.activeNotifications = {}
Notification.notificationId = 0

Notification.UI:RegisterEventHandler("Ready", function()
    Notification.UIReady = true
end)

Notification.UI:RegisterEventHandler("NotificationClosed", function(data)
    if data and data.id then
        Notification.activeNotifications[data.id] = nil
        Notification.CheckVisibility()
    end
end)

Notification.UI:RegisterEventHandler("AllNotificationsClosed", function()
    Notification.Hide()
end)

function Notification.Show()
    if Notification.isVisible then return end
    Notification.isVisible = true
end

function Notification.Hide()
    if not Notification.isVisible then return end
    Notification.isVisible = false
end

function Notification.CheckVisibility()
    local hasActive = false
    for _, active in pairs(Notification.activeNotifications) do
        if active then
            hasActive = true
            break
        end
    end

    if hasActive then
        Notification.Show()
    else
        Notification.Hide()
    end
end

function Notification.Send(type, title, message, duration, position)
    if not Notification.UIReady then
        Timer.SetTimeout(function()
            Notification.Send(type, title, message, duration, position)
        end, 100)
        return
    end

    type = type or "info"
    title = title or "Notification"
    message = message or ""
    duration = duration or 3000

    Notification.notificationId = Notification.notificationId + 1
    local id = "notif_" .. Notification.notificationId

    Notification.UI:SendEvent("AddNotification", {
        id = id,
        type = type,
        title = title,
        message = message,
        duration = duration,
        position = position or "top-right"
    })
    Notification.activeNotifications[id] = true
    Notification.Show()

    Timer.SetTimeout(function()
        Notification.Remove(id)
    end, duration + 500)

    return id
end

function Notification.Remove(id)
    if not Notification.activeNotifications[id] then
        return
    end

    if Notification.UI then
        Notification.UI:SendEvent("RemoveNotification", { id = id })
    end

    Notification.activeNotifications[id] = nil
    Notification.CheckVisibility()
end

function Notification.Clear()
    if Notification.UI then
        Notification.UI:SendEvent("ClearAll")
    end
    Notification.activeNotifications = {}
    Notification.Hide()
end

function Notification.Destroy()
    Notification.Clear()

    if Notification.UI then
        Notification.UI:Destroy()
        Notification.UI = nil
        Notification.UIReady = false
        Notification.isVisible = false
    end
end

function Notification.Success(title, message, duration, position)
    return Notification.Send("success", title, message, duration, position)
end

function Notification.Error(title, message, duration, position)
    return Notification.Send("error", title, message, duration, position)
end

function Notification.Warning(title, message, duration, position)
    return Notification.Send("warning", title, message, duration, position)
end

function Notification.Info(title, message, duration, position)
    return Notification.Send("info", title, message, duration, position)
end

_G.Notification = Notification

function onShutdown()
    Notification.Destroy()
end
