let isInDropdown = false;
let scrollDelay = false;
let persistentOptions = null;
let visibleOptionElements = [];
let editMode = false;


document.addEventListener("blur", (ev) => {
    const focusCatcher = document.getElementById("ContextFocusCatcher");
    
    // Don't steal focus if we're typing in an input field
    const activeElement = document.activeElement;
    const isInput = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'SELECT'
    );
    
    // Only refocus the menu if we're not in an input and we're in edit mode
    if (focusCatcher && !document.hidden && !isInput && !editMode) {
        setTimeout(() => {
            // Double check we're still not in an input
            const currentActive = document.activeElement;
            const stillNotInput = !currentActive || (
                currentActive.tagName !== 'INPUT' && 
                currentActive.tagName !== 'TEXTAREA' && 
                currentActive.tagName !== 'SELECT'
            );
            
            if (stillNotInput) {
                focusCatcher.focus();
            }
        }, 0);
    }
}, true);

$(document).on('keydown', function (e) {
    if (editMode) {
        handleEditMode(e);
        return;
    }
    handleNavigation(e);
});

// When clicking on inputs, automatically enter edit mode
$(document).on("focus", "input, textarea, select", function (e) {
    editMode = true;
    // Select the parent option
    const $option = $(this).closest('.option');
    if ($option.length) {
        $('.option').removeClass('selected');
        $option.addClass('selected');
    }
});

// When leaving inputs, exit edit mode
$(document).on("blur", "input, textarea, select", function (e) {
    // Small delay to check if we're still in an input
    setTimeout(() => {
        const activeElement = document.activeElement;
        const stillInInput = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.tagName === 'SELECT'
        );
        
        if (!stillInInput) {
            editMode = false;
        }
    }, 100);
});

$(document).on("keydown", "input, textarea, select", function (e) {
    // Allow typing normally, but handle special keys
    if (e.keyCode === 27) { // Escape
        e.preventDefault();
        e.stopPropagation();
        $(this).blur();
        editMode = false;
        // Refocus the menu
        setTimeout(() => {
            document.getElementById("ContextFocusCatcher").focus();
        }, 0);
    } else if (e.keyCode === 13) { // Enter
        e.preventDefault();
        e.stopPropagation();
        $(this).blur();
        editMode = false;
        // Refocus the menu
        setTimeout(() => {
            document.getElementById("ContextFocusCatcher").focus();
        }, 0);
    }
    // Don't prevent arrow keys in inputs - let them work normally for text navigation
});

function handleNavigation(e) {
    let $selected = $('.option.selected');
    if (!$selected.length) return;

    switch (e.keyCode) {
        case 38: // ArrowUp
        case 40: // ArrowDown
            e.preventDefault();
            rebuildVisibleOptionList();
            moveFocus(e.keyCode);
            break;

        case 37: // ArrowLeft
            if ($selected.hasClass('list-picker')) {
                $selected.find('.controls .left').click();
            } else if ($selected.hasClass('range-input') || $selected.hasClass('number-input')) {
                adjustOptionValue($selected, e.keyCode);
            } else {
                collapseFocusedOption();
            }
            break;

        case 39: // ArrowRight
            if ($selected.hasClass('list-picker')) {
                $selected.find('.controls .right').click();
            } else if ($selected.hasClass('range-input') || $selected.hasClass('number-input')) {
                adjustOptionValue($selected, e.keyCode);
            } else {
                expandFocusedOption();
            }
            break;

        case 13: // Enter
            if (
                $selected.hasClass('text-input') ||
                $selected.hasClass('password-input') ||
                $selected.hasClass('number-input') ||
                $selected.hasClass('date-input') ||
                $selected.hasClass('color-input')
            ) {
                editMode = true;
                // Focus the input field
                const input = $selected.find('input').first();
                if (input.length) {
                    input.focus();
                }
            } else if ($selected.hasClass('range-input')) {
                editMode = true;
            } else {
                selectFocusedOption();
            }
            break;

        case 8:  // Backspace
            // Don't close menu if we're in an input
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
                return; // Let backspace work normally
            }
            e.preventDefault();
            e.stopPropagation();
            closeMenu();
            break;

        case 27: // Escape
            closeMenu();
            break;
    }
}

function handleEditMode(e) {
    let $selected = $('.option.selected');
    if (!$selected.length) return;

    switch (e.keyCode) {
        case 37: // ArrowLeft
        case 39: // ArrowRight
            adjustOptionValue($selected, e.keyCode);
            break;

        case 8:  // BackSpace
            // Check if we're actually in an input field
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                // Let backspace work normally in inputs
                return;
            }
            // Otherwise, exit edit mode
            e.preventDefault();
            e.stopPropagation();
            editMode = false;
            break;

        case 27: // Escape
            editMode = false;
            break;

        case 13: // Enter
            editMode = false;
            selectFocusedOption();
            break;
    }
}

function closeMenu() {
    if (typeof hEvent === 'function') {
        hEvent('CloseMenu', {});
    }
}

function executeCallback(id, params) {
    if (typeof hEvent === 'function') {
        hEvent('ExecuteCallback', { id: id, params: params });
    }
}



let pendingMenuItems = [];

function buildContextMenu(items) {
    if (typeof items === 'string') {
        try {
            items = JSON.parse(items);
        } catch (e) {
        }
    }

    $('#context-menu-container').empty();

    let itemsArray = [];
    if (Array.isArray(items)) {
        itemsArray = items;
    } else if (typeof items === 'object') {
        for (let key in items) {
            itemsArray.push(items[key]);
        }
    }

    if (itemsArray.length === 0) {
        $('#context-menu-container').html('<div style="color:orange; padding:20px;">Menu has 0 items</div>');
    } else {
        itemsArray.forEach((item, index) => {
            const element = createMenuElement(item);
            if (element) {
                $('#context-menu-container').append(element);
            }
        });
    }

    persistentOptions = itemsArray;

    $('.context-menu').removeClass('hidden');
    $('.screen').removeClass('hidden');
    rebuildVisibleOptionList();

    $('.option:visible').first().addClass('selected');

    updateOptionCounter();

    setTimeout(() => {
        document.getElementById("ContextFocusCatcher").focus();
    }, 100);

}

function closeContextMenu() {
    $('.context-menu').addClass('hidden');
    $('.screen').addClass('hidden');
    $('#context-menu-container').empty();
}

window.addEventListener('message', (event) => {
    const eventData = event.data;
    const eventAction = eventData.name || eventData.action;

    if (eventAction === 'ClearMenuItems') {
        pendingMenuItems = [];
    } else if (eventAction === 'AddMenuItem') {
        const item = eventData.args && eventData.args[0];
        if (item) {
            pendingMenuItems.push(item);
        }
    } else if (eventAction === 'BuildMenu') {
        buildContextMenu(pendingMenuItems);
    } else if (eventAction === 'BuildContextMenu') {
        const data = eventData.args && eventData.args[0];
        if (data && data.items) {
            buildContextMenu(data.items);
        }
    } else if (eventAction === 'CloseContextMenu') {
        closeContextMenu();
    } else if (eventAction === 'SetHeader') {
        const data = eventData.args && eventData.args[0];
        if (data && data.header) {
            $('.options-qty p:first').text(data.header || 'Options');
            updateOptionCounter();
        }
    } else if (eventAction === 'SetMenuInfo') {
        const data = eventData.args && eventData.args[0];
        if (data) {
            if (data.title) {
                $('.header .title').text(data.title);
            }
            if (data.description) {
                $('.info .head p').text(data.title || 'Information');
                $('.info .description').text(data.description);
                $('.info').css('display', 'flex');
            } else {
                $('.info').css('display', 'none');
            }
        }
    } else if (eventAction === 'FocusOptionById') {
        const data = eventData.args && eventData.args[0];
        if (data && data.id) {
            $('.option').removeClass('selected');
            $(`.option[data-id="${data.id}"]`).addClass('selected');
            scrollToSelectedOption();
        }
    } else if (eventAction === 'SelectFocusedOption') {
        selectFocusedOption();
    } else if (eventAction === 'ShowNotification') {
        const data = eventData.args && eventData.args[0];
        if (data) {
            const notification = $('<div class="notification"></div>');
            notification.html(`
                <div class="notification-title">${data.title}</div>
                <div class="notification-message">${data.message}</div>
            `);
            if (data.color) {
                notification.css('background-color', data.color);
            }
            $('#notifications-container').append(notification);
            setTimeout(() => {
                notification.fadeOut(() => notification.remove());
            }, data.duration || 3000);
        }
    }
});

// Helper function to create menu elements
function createMenuElement(item) {
    let element;

    switch (item.type) {
        case 'button':
            element = $(`
                <div class="option action" data-id="${item.id}">
                    <p class="name">${item.text || item.label}</p>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.90784 12.6219L4.66811 9.3822C4.47662 9.19071 4.2169 9.08313 3.94609 9.08313C3.67528 9.08313 3.41556 9.19071 3.22407 9.3822C3.03258 9.5737 2.925 9.83341 2.925 10.1042C2.925 10.2383 2.95141 10.3711 3.00272 10.495C3.05404 10.6189 3.12925 10.7314 3.22407 10.8262L7.19053 14.7927C7.5899 15.1921 8.2352 15.1921 8.63457 14.7927L16.7763 6.65102C16.9677 6.45952 17.0753 6.19981 17.0753 5.929C17.0753 5.65819 16.9677 5.39847 16.7763 5.20698C16.5848 5.01549 16.325 4.90791 16.0542 4.90791C15.7834 4.90791 15.5237 5.01548 15.3323 5.20695C15.3322 5.20696 15.3322 5.20697 15.3322 5.20698M7.90784 12.6219L15.3322 5.20698" stroke-width="0.150002" />
                    </svg>
                </div>
            `);
            element.on('click', () => executeCallback(item.id, null));
            break;

        case 'checkbox':
            element = $(`
                <div class="option checkbox ${item.checked ? 'active' : ''}" data-id="${item.id}">
                    <p class="name">${item.label}</p>
                    <div class="check">
                        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.90784 8.62145L2.66811 5.38172C2.47662 5.19022 2.2169 5.08265 1.94609 5.08265C1.67528 5.08265 1.41556 5.19022 1.22407 5.38172C1.03258 5.57321 0.924999 5.83292 0.924999 6.10373C0.924999 6.23783 0.95141 6.3706 1.00272 6.49449C1.05404 6.61837 1.12925 6.73094 1.22407 6.82575L5.19053 10.7922C5.5899 11.1916 6.2352 11.1916 6.63457 10.7922L14.7763 2.65053C14.9677 2.45904 15.0753 2.19932 15.0753 1.92851C15.0753 1.6577 14.9677 1.39798 14.7763 1.20649C14.5848 1.015 14.325 0.907421 14.0542 0.907421C13.7834 0.907421 13.5237 1.01499 13.3323 1.20646C13.3322 1.20647 13.3322 1.20648 13.3322 1.20649M5.90784 8.62145L13.3322 1.20649M5.90784 8.62145L13.3322 1.20649M5.90784 8.62145L13.3322 1.20649" stroke-width="0.150002" />
                        </svg>
                    </div>
                </div>
            `);
            element.on('click', function () {
                $(this).toggleClass('active');
                executeCallback(item.id, $(this).hasClass('active'));
            });
            break;

        case 'dropdown':
            element = $(`
                <div class="option dropdown" data-id="${item.id}">
                    <div class="dropdown-header">
                        <p class="name">${item.label}</p>
                        <span class="arrow">▼</span>
                    </div>
                    <div class="dropdown-content hidden"></div>
                </div>
            `);

            // Add dropdown items
            if (item.options) {
                const content = element.find('.dropdown-content');
                item.options.forEach(opt => {
                    const subElement = createMenuElement(opt);
                    if (subElement) {
                        content.append(subElement);
                    }
                });
            }

            // Handle dropdown toggle
            element.find('.dropdown-header').on('click', function () {
                const content = $(this).siblings('.dropdown-content');
                content.toggleClass('hidden');
                $(this).find('.arrow').text(content.hasClass('hidden') ? '▼' : '▲');
            });
            break;

        case 'range':
            element = $(`
                <div class="option range-input" data-id="${item.id}">
                    <p class="name">${item.label}</p>
                    <input type="range" min="${item.min}" max="${item.max}" value="${item.value}">
                    <span class="range-value">${item.value}</span>
                </div>
            `);
            element.find('input').on('input', function () {
                element.find('.range-value').text(this.value);
                executeCallback(item.id, parseFloat(this.value));
            });
            break;

        case 'text-input':
            element = $(`
                <div class="option text-input" data-id="${item.id}">
                    <p class="name">${item.label}</p>
                    <div class="input">
                        <input type="text" placeholder="${item.placeholder || 'Enter text'}">
                    </div>
                </div>
            `);
            element.find('input').on('change', function () {
                executeCallback(item.id, this.value);
            });
            break;

        case 'password':
            element = $(`
                <div class="option password-input" data-id="${item.id}">
                    <p class="name">${item.label}</p>
                    <div class="input">
                        <input type="password" placeholder="${item.placeholder || ''}">
                    </div>
                </div>
            `);
            element.find('input').on('change', function () {
                executeCallback(item.id, this.value);
            });
            break;

        case 'radio':
            element = $(`<div class="option radio-group" data-id="${item.id}">
                <p class="name">${item.label}</p>
                <div class="radio-options"></div>
            </div>`);

            const radioContainer = element.find('.radio-options');
            item.options.forEach(opt => {
                const radio = $(`
                    <label>
                        <input type="radio" name="${item.id}" value="${opt.value}" ${opt.checked ? 'checked' : ''}>
                        ${opt.text}
                    </label>
                `);
                radioContainer.append(radio);
            });

            element.find('input[type="radio"]').on('change', function () {
                executeCallback(item.id, this.value);
            });
            break;

        case 'number':
            element = $(`
                <div class="option number-input" data-id="${item.id}">
                    <p class="name">${item.label}</p>
                    <div class="input">
                        <input type="number" value="${item.value}">
                    </div>
                </div>
            `);
            element.find('input').on('change', function () {
                executeCallback(item.id, parseFloat(this.value));
            });
            break;

        case 'select':
            // Find currently selected option
            let currentSelected = item.options.find(opt => opt.selected) || item.options[0];
            
            element = $(`
                <div class="option select-input" data-id="${item.id}">
                    <p class="name">${item.label}</p>
                    <div class="input custom-select">
                        <div class="select-display">${currentSelected ? currentSelected.text : 'Select...'}</div>
                        <div class="select-dropdown hidden"></div>
                    </div>
                </div>
            `);

            const customSelect = element.find('.custom-select');
            const display = element.find('.select-display');
            const dropdown = element.find('.select-dropdown');
            
            // Add options to dropdown
            item.options.forEach(opt => {
                const optionEl = $(`<div class="select-option" data-value="${opt.value}">${opt.text}</div>`);
                if (opt.selected) {
                    optionEl.addClass('selected');
                }
                dropdown.append(optionEl);
            });

            // Toggle dropdown on click
            customSelect.on('click', function(e) {
                e.stopPropagation();
                dropdown.toggleClass('hidden');
                customSelect.toggleClass('open');
            });
            
            // Handle option selection
            dropdown.on('click', '.select-option', function(e) {
                e.stopPropagation();
                const value = $(this).data('value');
                const text = $(this).text();
                
                // Update display
                display.text(text);
                
                // Update selected state
                dropdown.find('.select-option').removeClass('selected');
                $(this).addClass('selected');
                
                // Close dropdown
                dropdown.addClass('hidden');
                customSelect.removeClass('open');
                
                // Execute callback
                executeCallback(item.id, value);
            });
            
            // Close dropdown when clicking outside
            $(document).on('click.select' + item.id, function() {
                dropdown.addClass('hidden');
                customSelect.removeClass('open');
            });
            break;

        case 'color':
            const initialColor = item.value || '#ffffff';
            element = $(`
                <div class="option color-input" data-id="${item.id}">
                    <p class="name">${item.label}</p>
                    <div class="input custom-color-picker">
                        <div class="color-display" style="background-color: ${initialColor}"></div>
                        <div class="color-value">${initialColor}</div>
                        <div class="color-palette hidden">
                            <div class="preset-colors"></div>
                        </div>
                    </div>
                </div>
            `);
            
            const colorPicker = element.find('.custom-color-picker');
            const colorDisplay = element.find('.color-display');
            const colorValue = element.find('.color-value');
            const colorPalette = element.find('.color-palette');
            const presetColors = element.find('.preset-colors');
            
            // Add preset colors - more colors for better selection
            const presets = [
                '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                '#FFFFFF', '#000000', '#808080', '#FFA500', '#800080', '#00FBDD',
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA5E9'
            ];
            
            presets.forEach(color => {
                const colorBox = $(`<div class="preset-color" style="background-color: ${color}" data-color="${color}"></div>`);
                presetColors.append(colorBox);
            });
            
            // Toggle palette on click
            colorPicker.on('click', function(e) {
                e.stopPropagation();
                colorPalette.toggleClass('hidden');
                colorPicker.toggleClass('open');
            });
            
            // Select preset color - immediate callback to Lua
            presetColors.on('click', '.preset-color', function(e) {
                e.stopPropagation();
                const color = $(this).data('color');
                
                // Update UI immediately
                colorDisplay.css('background-color', color);
                colorValue.text(color);
                
                // Close palette
                colorPalette.addClass('hidden');
                colorPicker.removeClass('open');
                
                // Execute callback to Lua immediately
                executeCallback(item.id, color);
            });
            
            // Close palette when clicking outside
            $(document).on('click.color' + item.id, function() {
                colorPalette.addClass('hidden');
                colorPicker.removeClass('open');
            });
            break;

        case 'date':
            element = $(`
                <div class="option date-input" data-id="${item.id}">
                    <p class="name">${item.label}</p>
                    <div class="input">
                        <input type="date" value="${item.value || '2024-01-01'}">
                    </div>
                </div>
            `);
            element.find('input').on('change', function () {
                executeCallback(item.id, this.value);
            });
            break;

        case 'list-picker':
            let currentIndex = 0;
            element = $(`
                <div class="option list-picker" data-id="${item.id}">
                    <p class="name">${item.label}</p>
                    <div class="list-picker-controls">
                        <div class="controls">
                            <button class="left">◀</button>
                            <span class="value">${item.list[0].label}</span>
                            <button class="right">▶</button>
                        </div>
                    </div>
                </div>
            `);

            element.find('.left').on('click', () => {
                currentIndex = (currentIndex - 1 + item.list.length) % item.list.length;
                element.find('.value').text(item.list[currentIndex].label);
                executeCallback(item.id, item.list[currentIndex]);
            });

            element.find('.right').on('click', () => {
                currentIndex = (currentIndex + 1) % item.list.length;
                element.find('.value').text(item.list[currentIndex].label);
                executeCallback(item.id, item.list[currentIndex]);
            });
            break;

        case 'text-display':
            if (item.is_list && Array.isArray(item.data)) {
                element = $(`<div class="option text-display" data-id="${item.id}">
                    <ul>${item.data.map(line => `<li>${line}</li>`).join('')}</ul>
                </div>`);
            } else {
                element = $(`<div class="option text-display" data-id="${item.id}">${item.data}</div>`);
            }
            break;
    }

    return element;
}

// Helper functions
function rebuildVisibleOptionList() {
    visibleOptionElements = $('.option:visible').toArray();
}

function moveFocus(keyCode) {
    const $selected = $('.option.selected');
    if (!$selected.length) {
        $('.option:visible').first().addClass('selected');
        updateOptionCounter();
        return;
    }

    const currentIndex = visibleOptionElements.findIndex(el => $(el).hasClass('selected'));
    let newIndex;

    if (keyCode === 38) { // Up
        newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    } else { // Down
        newIndex = currentIndex < visibleOptionElements.length - 1 ? currentIndex + 1 : currentIndex;
    }

    if (newIndex !== currentIndex) {
        $('.option').removeClass('selected');
        $(visibleOptionElements[newIndex]).addClass('selected');
        scrollToSelectedOption();
        updateOptionCounter();
    }
}

function scrollToSelectedOption() {
    const $selected = $('.option.selected');
    if ($selected.length) {
        $selected[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function expandFocusedOption() {
    const $selected = $('.option.selected');
    if ($selected.hasClass('dropdown')) {
        const content = $selected.find('.dropdown-content');
        content.removeClass('hidden');
        $selected.find('.arrow').text('▲');
        rebuildVisibleOptionList();
    }
}

function collapseFocusedOption() {
    const $selected = $('.option.selected');
    if ($selected.hasClass('dropdown')) {
        const content = $selected.find('.dropdown-content');
        content.addClass('hidden');
        $selected.find('.arrow').text('▼');
        rebuildVisibleOptionList();
    }
}

function selectFocusedOption() {
    const $selected = $('.option.selected');
    
    if ($selected.hasClass('action')) {
        // Button - trigger click
        $selected.click();
    } else if ($selected.hasClass('checkbox')) {
        // Checkbox - toggle state
        $selected.click();
    } else if ($selected.hasClass('dropdown')) {
        // Dropdown - expand/collapse
        expandFocusedOption();
    } else if ($selected.hasClass('radio-group')) {
        // Radio - select this option
        const radio = $selected.find('input[type="radio"]:first');
        if (radio.length) {
            radio.prop('checked', true);
            radio.trigger('change');
        }
    } else if ($selected.hasClass('select-input')) {
        // Custom select - toggle dropdown
        $selected.find('.custom-select').click();
    } else if ($selected.hasClass('list-picker')) {
        // List picker - cycle to next item
        $selected.find('.controls .right').click();
    } else if ($selected.hasClass('color-input')) {
        // Custom color picker - toggle palette
        $selected.find('.custom-color-picker').click();
    } else if ($selected.hasClass('date-input')) {
        // Date input - open date picker
        $selected.find('input[type="date"]').focus();
    }
}

// Function to update option counter
function updateOptionCounter() {
    const $allOptions = $('.option:visible');
    const $selected = $('.option.selected');

    if ($allOptions.length > 0 && $selected.length > 0) {
        const currentIndex = $allOptions.index($selected) + 1;
        const total = $allOptions.length;

        // Update only the counter in the options-qty section
        $('.options-qty .qty').text(`${currentIndex}/${total}`);
    }
}

function adjustOptionValue($option, keyCode) {
    if ($option.hasClass('range-input')) {
        const input = $option.find('input[type="range"]');
        const step = parseFloat(input.attr('step')) || 1;
        const current = parseFloat(input.val());
        const min = parseFloat(input.attr('min'));
        const max = parseFloat(input.attr('max'));

        let newValue;
        if (keyCode === 37) { // Left
            newValue = Math.max(min, current - step);
        } else { // Right
            newValue = Math.min(max, current + step);
        }

        input.val(newValue);
        input.trigger('input');
    } else if ($option.hasClass('number-input')) {
        const input = $option.find('input[type="number"]');
        const current = parseFloat(input.val()) || 0;

        let newValue;
        if (keyCode === 37) { // Left
            newValue = current - 1;
        } else { // Right
            newValue = current + 1;
        }

        input.val(newValue);
        input.trigger('change');
    }
}

setTimeout(function() {
    if (typeof hEvent === 'function') {
        hEvent('Ready', {});
    }
}, 100);