let pendingOptions = [];
let currentOptions = [];
let actualPage = 0;

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

// DOM References
const $options = {
    header: {
        title: $('.options-selector header h1'),
        playersCount: $('.options-selector header .players-count .value'),
    },
    slider: {
        wrapper: $('.options-selector .slider'),
        options: $('.options-selector .slider .options .scroller'),
        button: $('.options-selector .slider .slide'),
        pages: $('.options-selector .slider .slider-pages'),
    }
};

const $selectedOptionInfo = {
    name: $('.selected-option .option-name'),
    description: $('.selected-option .option-description'),
    infoList: $('.selected-option .info .list'),
};

window.addEventListener('message', (event) => {
    const eventData = event.data;
    const eventAction = eventData.name || eventData.action;

    if (eventAction === 'ClearOptions') {
        pendingOptions = [];
        currentOptions = [];
        actualPage = 0;
    } else if (eventAction === 'AddOption') {
        const data = eventData.args && eventData.args[0];
        if (data) {
            let option = pendingOptions.find(opt => opt.id === data.id);
            if (!option) {
                option = {
                    id: data.id,
                    name: data.name,
                    image: data.image,
                    description: data.description,
                    info: data.info || []
                };
                pendingOptions.push(option);
            }
        }
    } else if (eventAction === 'BuildMenu') {
        currentOptions = pendingOptions;
        renderOptions();
        if (currentOptions.length > 0) {
            setSelectedOptionInfo(currentOptions[0]);
        }
    } else if (eventAction === 'SetMenuTitle') {
        const data = eventData.args && eventData.args[0];
        if (data && data.title) {
            $options.header.title.text(sanitizeHTML(data.title));
        }
    } else if (eventAction === 'SetPlayersCount') {
        const data = eventData.args && eventData.args[0];
        if (data && data.count !== undefined) {
            $options.header.playersCount.text(data.count);
        }
    } else if (eventAction === 'ShowMenu') {
        $('body').removeClass('hidden');
    } else if (eventAction === 'HideMenu') {
        $('body').addClass('hidden');
    }
});

// Internal functions
function renderOptions() {
    $options.slider.options.find('.option').remove();

    currentOptions.forEach((option, index) => {
        $options.slider.options.append(`<div class="option ${index == 0 ? "selected" : ""}" data-id="${sanitizeHTML(option.id)}">
            <img src="${sanitizeHTML(option.image)}" alt="${sanitizeHTML(option.name)}" class="bg">
            <p class="name">${sanitizeHTML(option.name)}</p>
            <p class="votes">0</p>
        </div>`);
    });

    // Setup pagination if needed
    if (currentOptions.length > 6) {
        $options.slider.wrapper.removeClass('disabled');
        $options.slider.wrapper.find('.button.right').removeClass('disabled');

        let pages = Math.ceil((currentOptions.length - 6) / 2);

        $options.slider.pages.empty();
        for (let i = 0; i < pages + 1; i++) {
            $options.slider.pages.append(`<div class="page ${i == 0 ? "selected" : ""}"></div>`);
        }
    } else {
        $options.slider.wrapper.addClass('disabled');
        $options.slider.pages.empty();
    }
}

function setSelectedOptionInfo(option) {
    $selectedOptionInfo.name.text(sanitizeHTML(option.name));
    $selectedOptionInfo.description.text(sanitizeHTML(option.description));

    $selectedOptionInfo.infoList.empty();
    if (option.info) {
        option.info.forEach(info => {
            $selectedOptionInfo.infoList.append(`<div>
                <img src="${sanitizeHTML(info.icon)}" alt="${sanitizeHTML(info.name)}" class="icon">
                <p class="name">${sanitizeHTML(info.name)}</p>
                <p class="value">${sanitizeHTML(info.value)}</p>
            </div>`);
        });
    }
}

function sendOptionSelected(optionId) {
    if (typeof hEvent === 'function') {
        hEvent('OnOptionSelected', { optionId: optionId });
    }
}

// Event handlers
// $(document).ready(function() {
// Option click handler (delegated for dynamic content)
$(document).on('click', '.options .option', function () {
    $('.options .option').removeClass('selected');
    $(this).addClass('selected');

    let optionId = $(this).data('id');
    let option = currentOptions.find(opt => opt.id === optionId);
    if (option) {
        setSelectedOptionInfo(option);
        sendOptionSelected(optionId);
    }
});

// Page navigation click handler
$(document).on('click', '.slider .slider-pages .page', function () {
    let index = $(this).index();
    actualPage = index;
    let optionWidth = $options.slider.options.find('.option').outerWidth(true) + 20;
    $options.slider.options.css('transform', `translateX(${-index * optionWidth * 2}px)`);

    $options.slider.pages.find('.page').removeClass('selected');
    $(this).addClass('selected');

    $options.slider.button.removeClass('unable');
    if (index == 0) {
        $('.slider button.slide[data-side="left"]').addClass('unable');
    } else if (index == $options.slider.pages.find('.page').length - 1) {
        $('.slider button.slide[data-side="right"]').addClass('unable');
    }
});

// Slider button handlers
$('.slider button.slide').click(function (e) {
    if ($(this).hasClass('unable')) return;

    let optionWidth = $options.slider.options.find('.option').outerWidth(true) + 20;
    let transform = $options.slider.options.css('transform');
    let actualTranslate = transform === 'none' ? 0 : parseInt(transform.split(',')[4]);
    let dataSide = $(this).attr('data-side');

    if (dataSide == "left") {
        actualPage--;
        $options.slider.options.css('transform', `translateX(${actualTranslate + optionWidth * 2}px)`);
    } else {
        actualPage++;
        $options.slider.options.css('transform', `translateX(${actualTranslate - optionWidth * 2}px)`);
    }

    $options.slider.pages.find('.page').removeClass('selected');
    $options.slider.pages.find(`.page:nth-child(${actualPage + 1})`).addClass('selected');

    $options.slider.button.removeClass('unable');
    if (actualPage == 0) {
        $('.slider button.slide[data-side="left"]').addClass('unable');
    } else if (actualPage == $options.slider.pages.find('.page').length - 1) {
        $('.slider button.slide[data-side="right"]').addClass('unable');
    }
});

$(document).on('keydown', function (e) {
    if (e.which === 8) {
        e.preventDefault();
        if (!$('body').hasClass('hidden')) {
            if (typeof hEvent === 'function') {
                hEvent('OnBackspace', {});
            }
        }
    }
});

$(document).ready(function () {
    setTimeout(function() {
        if (typeof hEvent === 'function') {
            hEvent('Ready', {});
        }
    }, 100);
});
