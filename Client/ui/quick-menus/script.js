/**
 * Sanitizes HTML input to prevent XSS attacks.
 * Converts potentially dangerous characters to their HTML entity equivalents.
 *
 * @param {string} str - The string to sanitize
 * @returns {string} The sanitized string safe for insertion into DOM
 */
function sanitizeHTML(str) {
    if (str === null || str === undefined) {
        return '';
    }
    str = String(str);

    // Create a temporary element and use textContent to escape HTML
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

window.addEventListener('message', (event) => {
    const eventData = event.data;
    const eventAction = eventData.name || eventData.action;

    if (eventAction === 'ShowInputMenu') {
        const data = eventData.args && eventData.args[0];
        if (data) {
            $('.input-menu .header .title').text(sanitizeHTML(data.title));
            $('.input-menu input').attr('placeholder', sanitizeHTML(data.placeholder));
            $('.input-menu input').val('');
            $('body').addClass('in-input-menu');

            const focusInput = () => {
                const input = $('.input-menu input');
                input.focus();
                input.get(0)?.focus();
            };

            focusInput();
            setTimeout(focusInput, 50);
            setTimeout(focusInput, 150);
        }
    } else if (eventAction === 'HideInputMenu') {
        $('.input-menu input').val('');
        $('body').removeClass('in-input-menu');
    } else if (eventAction === 'ShowConfirmMenu') {
        const data = eventData.args && eventData.args[0];
        if (data) {
            $('.confirm-menu .header .title').text(sanitizeHTML(data.title));
            $('.confirm-menu .message').text(sanitizeHTML(data.message));
            $('body').addClass('in-confirm-menu');
        }
    } else if (eventAction === 'HideConfirmMenu') {
        $('body').removeClass('in-confirm-menu');
    }
});

function sendInputValue(value) {
    const safeValue = value || "";
    if (typeof hEvent === 'function') {
        hEvent('OnInputConfirmed', { value: safeValue });
    }
}

function sendInputCancel() {
    if (typeof hEvent === 'function') {
        hEvent('OnInputCanceled', {});
    }
}

function sendConfirmYes() {
    if (typeof hEvent === 'function') {
        hEvent('OnConfirmYes', {});
    }
}

function sendConfirmNo() {
    if (typeof hEvent === 'function') {
        hEvent('OnConfirmNo', {});
    }
}

// Input menu events
// $(document).ready(function() {
// Input menu confirm button
$('.input-menu .confirm').on('click', function () {
    const value = $('.input-menu input').val();
    sendInputValue(value);
});

// Input menu cancel button
$('.input-menu .cancel').on('click', function () {
    sendInputCancel();
});

// Input menu close button (X)
$('.input-menu .close-panel').on('click', function () {
    sendInputCancel();
});

// Confirm menu yes button
$('.confirm-menu .confirm').on('click', function () {
    sendConfirmYes();
});

// Confirm menu no button
$('.confirm-menu .cancel').on('click', function () {
    sendConfirmNo();
});

// Confirm menu close button (X)
$('.confirm-menu .close-panel').on('click', function () {
    sendConfirmNo();
});

// Handle Enter key in input field
$('.input-menu input').on('keypress', function (e) {
    if (e.which === 13) { // Enter key
        const value = $(this).val();
        sendInputValue(value);
    }
});

// Handle Escape key for both menus
$(document).on('keydown', function (e) {
    if (e.which === 27) { // Escape key
        if ($('body').hasClass('in-input-menu')) {
            sendInputCancel();
        } else if ($('body').hasClass('in-confirm-menu')) {
            sendConfirmNo();
        }
    }
});

setTimeout(function() {
    if (typeof hEvent === 'function') {
        hEvent('Ready', {});
    }
}, 100);
