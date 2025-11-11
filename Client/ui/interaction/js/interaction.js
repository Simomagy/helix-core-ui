const interactions = {};
let containerVisible = false;

function ShowContainer() {
    if (containerVisible) return;
    $('#interactions-container').removeClass('hidden');
    containerVisible = true;
}

function HideContainer() {
    if (!containerVisible) return;
    $('#interactions-container').addClass('hidden');
    containerVisible = false;
}

function checkVisibility() {
    const visibleInteractions = $('#interactions-container').children('.interaction-item.show');

    if (visibleInteractions.length === 0) {
        HideContainer();
        if (typeof hEvent === 'function') {
            hEvent('AllInteractionsClosed', {});
        }
    }
}

window.addEventListener('message', (event) => {
    const eventData = event.data;
    const eventAction = eventData.name || eventData.action;

    if (eventAction === 'AddInteraction') {
        const data = eventData.args && eventData.args[0];
        if (data) {
            const template = $('#interaction-template').clone();
            template.attr('id', `interaction-${data.id}`);
            template.addClass('visible');
            template.show();

            template.find('.interaction-text').text(data.text.toUpperCase());
            template.find('.key-text').text(data.key.toUpperCase());

            $('#interactions-container').append(template);

            interactions[data.id] = {
                element: template,
                duration: data.duration
            };

            ShowContainer();

            setTimeout(() => {
                template.addClass('show');
            }, 50);
        }
    } else if (eventAction === 'RemoveInteraction') {
        const data = eventData.args && eventData.args[0];
        if (data && data.id) {
            const interaction = interactions[data.id];
            if (interaction) {
                interaction.element.removeClass('show');

                setTimeout(() => {
                    interaction.element.remove();
                    delete interactions[data.id];
                    checkVisibility();
                }, 300);
            }
        }
    } else if (eventAction === 'StartProgress') {
        const data = eventData.args && eventData.args[0];
        if (data && data.id) {
            const interaction = interactions[data.id];
            if (interaction) {
                interaction.element.addClass('pressing');
            }
        }
    } else if (eventAction === 'UpdateProgress') {
        const data = eventData.args && eventData.args[0];
        if (data && data.id) {
            const interaction = interactions[data.id];
            if (interaction) {
                const circle = interaction.element.find('.progress-circle');
                circle.css({
                    'stroke': '#00FBDD',
                    'stroke-dasharray': `${data.progress}, 100`
                });
            }
        }
    } else if (eventAction === 'ResetProgress') {
        const data = eventData.args && eventData.args[0];
        if (data && data.id) {
            const interaction = interactions[data.id];
            if (interaction) {
                interaction.element.removeClass('pressing');

                const circle = interaction.element.find('.progress-circle');
                circle.css({
                    'stroke': 'transparent',
                    'stroke-dasharray': '0, 100',
                    'transition': 'stroke-dasharray 0.3s ease-out'
                });
            }
        }
    } else if (eventAction === 'ClearAll') {
        for (const id in interactions) {
            const interaction = interactions[id];
            if (interaction) {
                interaction.element.removeClass('show');
                setTimeout(() => {
                    interaction.element.remove();
                }, 300);
            }
        }
        interactions = {};
        HideContainer();
    }
});

setTimeout(function() {
    if (typeof hEvent === 'function') {
        hEvent('Ready', {});
    }
}, 100);
