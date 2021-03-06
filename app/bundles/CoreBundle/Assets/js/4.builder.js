/**
 * Launch builder
 *
 * @param formName
 */
Mautic.launchBuilder = function (formName, actionName) {
    Mautic.builderMode     = (mQuery('#' + formName + '_template').val() == '') ? 'custom' : 'template';
    Mautic.builderFormName = formName;

    mQuery('body').css('overflow-y', 'hidden');

    // Activate the builder
    mQuery('.builder').addClass('builder-active').removeClass('hide');

    if (typeof actionName == 'undefined') {
        actionName = formName;
    }

    var builderCss = {
        margin: "0",
        padding: "0",
        border: "none",
        width: "100%",
        height: "100%"
    };

    var panelHeight = (mQuery('.builder-content').css('right') == '0px') ? mQuery('.builder-panel').height() : 0,
        panelWidth = (mQuery('.builder-content').css('right') == '0px') ? 0 : mQuery('.builder-panel').width(),
        spinnerLeft = (mQuery(window).width() - panelWidth - 60) / 2,
        spinnerTop = (mQuery(window).height() - panelHeight - 60) / 2;

    var overlay     = mQuery('<div id="builder-overlay" class="modal-backdrop fade in"><div style="position: absolute; top:' + spinnerTop + 'px; left:' + spinnerLeft + 'px" class="builder-spinner"><i class="fa fa-spinner fa-spin fa-5x"></i></div></div>').css(builderCss).appendTo('.builder-content');

    // Disable the close button until everything is loaded
    mQuery('.btn-close-builder').prop('disabled', true);

    // Load the theme from the custom HTML textarea
    var themeHtml = mQuery('textarea.builder-html').val();

    if (themeHtml.length) {
        Mautic.buildBuilderIframe(themeHtml, builderCss);
    } else {
        // Load the theme from a theme HTML if the textarea is empty
        var src = mQuery('#builder_url').val();
            src += '?template=' + mQuery('#' + formName + '_template').val();

        mQuery.get(src, function(themeHtml) {
            Mautic.buildBuilderIframe(themeHtml, builderCss);
        });
    }
};

Mautic.buildBuilderIframe = function(themeHtml, builderCss) {

    var builder = mQuery("<iframe />", {
        css: builderCss,
        id: "builder-template-content"
    }).appendTo('.builder-content');

    // Insert the Mautic assets to the header
    var assets = Mautic.htmlspecialchars_decode(mQuery('[data-builder-assets]').html());
    var assetsText = '';
    themeHtml = themeHtml.replace('</head>', assets+'</head>');

    // Build the iframe with the theme HTML in it
    var iframe = document.getElementById('builder-template-content');
    var doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(themeHtml);
    doc.close();
    builder.load(function() {
        mQuery('#builder-overlay').addClass('hide');
        mQuery('.btn-close-builder').prop('disabled', false);
    });
}

Mautic.htmlspecialchars_decode = function(encodedHtml) {
    encodedHtml = encodedHtml.replace(/&quot;/g, '"');
    encodedHtml = encodedHtml.replace(/&#039;/g, "'");
    encodedHtml = encodedHtml.replace(/&amp;/g, '&');
    encodedHtml = encodedHtml.replace(/&lt;/g, '<');
    encodedHtml = encodedHtml.replace(/&gt;/g, '>');
    return encodedHtml;
};

/**
 * Close the builder
 *
 * @param model
 */
Mautic.closeBuilder = function(model) {
    var panelHeight = (mQuery('.builder-content').css('right') == '0px') ? mQuery('.builder-panel').height() : 0,
        panelWidth = (mQuery('.builder-content').css('right') == '0px') ? 0 : mQuery('.builder-panel').width(),
        spinnerLeft = (mQuery(window).width() - panelWidth - 60) / 2,
        spinnerTop = (mQuery(window).height() - panelHeight - 60) / 2;
    mQuery('.builder-spinner').css({
        left: spinnerLeft,
        top: spinnerTop
    });
    mQuery('#builder-overlay').removeClass('hide');
    mQuery('.btn-close-builder').prop('disabled', true);

    // Trigger slot:destroy event
    document.getElementById('builder-template-content').contentWindow.Mautic.destroySlots();

    var themeHtml = mQuery('iframe#builder-template-content').contents();

    // Remove Mautic's assets
    themeHtml.find('[data-source="mautic"]').remove();
    themeHtml.find('.atwho-container').remove();

    // Store the HTML content to the HTML textarea
    mQuery('.builder-html').val(themeHtml.find('html').get(0).outerHTML);

    // Kill the overlay
    mQuery('#builder-overlay').remove();

    // Hide builder
    mQuery('.builder').removeClass('builder-active').addClass('hide');
    mQuery('.btn-close-builder').prop('disabled', false);
    mQuery('body').css('overflow-y', '');
    mQuery('.builder').addClass('hide');
    Mautic.stopIconSpinPostEvent();
    mQuery('#builder-template-content').remove();

    delete Mautic.builderMode;
    delete Mautic.builderFormName;
};

Mautic.destroySlots = function() {
    // Trigger destroy slots event
    if (typeof Mautic.builderSlots !== 'undefined' && Mautic.builderSlots.length) {
        mQuery.each(Mautic.builderSlots, function(i, slotParams) {
            mQuery(slotParams.slot).trigger('slot:destroy', slotParams);
            delete Mautic.builderSlots[i];
        });
    }

    // Destroy sortable
    Mautic.builderContents.find('[data-slot-container]').sortable( "destroy" );

    // Remove empty class="" attr
    Mautic.builderContents.find('*[class=""]').removeAttr('class');

    // Remove border highlighted by Froala
    mQuery.each(Mautic.builderContents.find('td, th, table'), function() {
        var td = mQuery(this);
        if (td.attr('fr-original-class')) {
            td.attr('class', td.attr('fr-original-class'));
            td.removeAttr('fr-original-class');
        }
        if (td.attr('fr-original-style')) {
            td.attr('style', td.attr('fr-original-style'));
            td.removeAttr('fr-original-style');
        }
        if (td.css('border') === '1px solid rgb(221, 221, 221)') {
            td.css('border', '');
        }
    });

    // Remove style="z-index: 2501;" which Froala forgets there
    Mautic.builderContents.find('*[style="z-index: 2501;"]').removeAttr('style');
};

Mautic.toggleBuilderButton = function (hide) {
    if (mQuery('.toolbar-form-buttons .toolbar-standard .btn-builder')) {
        if (hide) {
            // Move the builder button out of the group and hide it
            mQuery('.toolbar-form-buttons .toolbar-standard .btn-builder')
                .addClass('hide btn-standard-toolbar')
                .appendTo('.toolbar-form-buttons')

            mQuery('.toolbar-form-buttons .toolbar-dropdown i.fa-cube').parent().addClass('hide');
        } else {
            if (!mQuery('.btn-standard-toolbar.btn-builder').length) {
                mQuery('.toolbar-form-buttons .toolbar-standard .btn-builder').addClass('btn-standard-toolbar')
            } else {
                // Move the builder button out of the group and hide it
                mQuery('.toolbar-form-buttons .btn-standard-toolbar.btn-builder')
                    .prependTo('.toolbar-form-buttons .toolbar-standard')
                    .removeClass('hide');

                mQuery('.toolbar-form-buttons .toolbar-dropdown i.fa-cube').parent().removeClass('hide');
            }
        }
    }
};

/**
 * Save the builder content to the session by a AJAX call
 *
 * @param model
 * @param entityId
 * @param content
 * @param callback
 */
Mautic.saveBuilderContent = function (model, entityId, content, callback) {
    mQuery.ajax({
        url: mauticAjaxUrl + '?action=' + model + ':setBuilderContent',
        type: "POST",
        data: {
            slots: content,
            entity: entityId
        },
        success: function (response) {
            if (typeof callback === "function") {
                callback(response);
            }
        }
    });
};

Mautic.initSlots = function() {
    var slotContainers = Mautic.builderContents.find('[data-slot-container]');

    // Make slots sortable
    slotContainers.sortable({
        items: '[data-slot]',
        handle: 'div[data-slot-handle]',
        placeholder: 'slot-placeholder',
        connectWith: '[data-slot-container]',
        stop: function(event, ui) {
            if (ui.item.hasClass('slot-type-handle')) {
                var slotTypeContent = ui.item.find('script').html();
                var newSlot = mQuery('<div/>').attr('data-slot', ui.item.attr('data-slot-type')).append(slotTypeContent);
                Mautic.builderContents.trigger('slot:init', newSlot);
                ui.item.replaceWith(newSlot);
            }
        }
    });

    // Allow to drag&drop new slots from the slot type menu
    mQuery('#slot-type-container .slot-type-handle', parent.document).draggable({
        iframeFix: true,
        iframeId: 'builder-template-content',
        connectToSortable: slotContainers,
        revert: 'invalid',
        appendTo: '.builder',
        helper: 'clone',
        zIndex: 8000,
        scroll: true,
        scrollSensitivity: 100,
        scrollSpeed: 100,
        cursorAt: {top: 15, left: 15},
        start: function( event, ui ) {
            mQuery(ui.helper).css({
                color: '#5d6c7c',
                background: '#f5f5f5',
                border: '1px solid #d3d3d3',
                height: '60px',
                width: '115px',
                borderRadius: '4px',
                fontSize: '16px',
                padding: '10px 16px',
                lineHeight: '1.25'
            });
        },
        stop: function(event, ui) {
            ui.helper = mQuery(event.target).closest('[data-slot-type]');
        }
    }).disableSelection();

    // Initialize the slots
    Mautic.builderContents.find('[data-slot]').each(function() {
        mQuery(this).trigger('slot:init', this);
    });
}

Mautic.initSlotListeners = function() {
    Mautic.builderSlots = [];
    Mautic.builderContents.on('slot:init', function(event, slot) {
        slot = mQuery(slot);
        var type = slot.attr('data-slot');

        // initialize the drag handle
        var handle = mQuery('<div/>').attr('data-slot-handle', true);
        slot.hover(function() {
            slot.append(handle);
        }, function() {
            handle.remove('div[data-slot-handle]');
        });

        slot.on('click', function() {

            // Update form in the Customize tab to the form of the focused slot type
            var focusType = mQuery(this).attr('data-slot');
            var focusForm = mQuery(parent.mQuery('script[data-slot-type-form="'+focusType+'"]').html());
            parent.mQuery('#slot-form-container').html(focusForm);

            // Prefill the form field values with the values from slot attributes if any
            mQuery.each(slot.get(0).attributes, function(i, attr) {
                var attrPrefix = 'data-param-';
                var regex = /data-param-(.*)/;
                var match = regex.exec(attr.name);

                if (match !== null) {
                    focusForm.find('input[type="text"][data-slot-param="'+match[1]+'"]').val(attr.value);
                    focusForm.find('input[type="radio"][data-slot-param="'+match[1]+'"][value="'+attr.value+'"]').prop('checked', 1);
                }
            });

            focusForm.find('.delete-slot').click(function(e) {
                slot.remove();
            });

            focusForm.on('keyup', function(e) {
                var field = mQuery(e.target);

                // Store the slot settings as attributes
                slot.attr('data-param-'+field.attr('data-slot-param'), field.val());

                // Trigger the slot:change event
                slot.trigger('slot:change', {slot: slot, field: field});
            });

            focusForm.find('.btn').on('click', function(e) {
                var field = mQuery(this).find('input:radio');

                if (field.length) {
                    // Store the slot settings as attributes
                    slot.attr('data-param-'+field.attr('data-slot-param'), field.val());

                    // Trigger the slot:change event
                    slot.trigger('slot:change', {slot: slot, field: field});
                }
            });

            // Initialize the color picker
            focusForm.find('input[data-toggle="color"]').each(function() {
                parent.Mautic.activateColorPicker(this);
            });
        });

        var linkList = Mautic.getPredefinedLinks();

        // Initialize different slot types
        if (type === 'text') {
            // init AtWho in a froala editor
            var method = 'page:getBuilderTokens';
            if (parent.mQuery('.builder').hasClass('email-builder')) {
                method = 'email:getBuilderTokens';
            }
            slot.on('froalaEditor.initialized', function (e, editor) {
                Mautic.initAtWho(editor.$el, method, editor);
            });

            var inlineFroalaOptions = {
                toolbarInline: true,
                toolbarVisibleWithoutSelection: true,
                toolbarButtons: ['bold', 'italic', 'insertImage', 'insertLink', 'undo', 'redo', '-', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'indent', 'outdent'],
                zIndex: 2501,
                linkList: linkList
            };

            slot.froalaEditor(mQuery.extend(inlineFroalaOptions, Mautic.basicFroalaOptions));
        } else if (type === 'image') {
            // Init Froala editor
            slot.find('img').froalaEditor(mQuery.extend({linkList: linkList}, Mautic.basicFroalaOptions));
        } else if (type === 'button') {
            slot.find('a').click(function(e) {
                e.preventDefault();
            });
        }

        // Store the slot to a global var
        Mautic.builderSlots.push({slot: slot, type: type});
    });

    Mautic.getPredefinedLinks = function() {
        var linkList = [];
        mQuery.each(parent.builderTokens, function(token, label) {
            if (token.startsWith('{pagelink=') || 
                token.startsWith('{assetlink=') || 
                token.startsWith('{webview_url') || 
                token.startsWith('{unsubscribe_url')) {
                
                linkList.push({
                    text: label,
                    href: token
                });
            }
        });

        return linkList;
    }

    Mautic.builderContents.on('slot:change', function(event, params) {
        // Change some slot styles when the values are changed in the slot edit form
        var fieldParam = params.field.attr('data-slot-param');
        if (fieldParam === 'padding-top' || fieldParam === 'padding-bottom') {
            params.slot.css(fieldParam, params.field.val() + 'px');
        } else if (fieldParam === 'href') {
            params.slot.find('a').attr('href', params.field.val());
        } else if (fieldParam === 'link-text') {
            params.slot.find('a').text(params.field.val());
        } else if (fieldParam === 'float') {
            var values = ['left', 'center', 'right'];
            params.slot.find('a').parent().attr('align', values[params.field.val()]);
        } else if (fieldParam === 'button-size') {
            var values = [
                {padding: '10px 13px', fontSize: '14px'},
                {padding: '12px 18px', fontSize: '16px'},
                {padding: '15px 20px', fontSize: '18px'}
            ];
            params.slot.find('a').css(values[params.field.val()]);
        }
    });

    Mautic.builderContents.on('slot:destroy', function(event, params) {
        if (params.type === 'text') {
            params.slot.froalaEditor('destroy');
        } else if (params.type === 'image') {
            params.slot.find('img').froalaEditor('destroy');
        }

        // Remove Symfony toolbar
        Mautic.builderContents.find('.sf-toolbar').remove();
    });
};


// Init inside the builder's iframe
mQuery(function() {
    if (parent.mQuery('#builder-template-content').length) {
        Mautic.builderContents = mQuery('body');
        Mautic.initSlotListeners();
        Mautic.initSlots();
    }
});
