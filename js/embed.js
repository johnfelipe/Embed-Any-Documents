jQuery(document).ready(function($) {
    var $popup = $('#embed-popup'),
        $wrap = $('#embed-popup-wrap'),
        $embedurl = $('#awsm_url'),
        $shortcode = $('#shortcode'),
        $message = $('#embed_message p'),
        $ActionPanel = $('.mceActionPanel'),
        $container = $('.ead_container'),
        fileurl = "",
        newprovider = "",
        frame,
        msextension = emebeder.msextension,
        drextension = emebeder.drextension;
    //Reset form data
    function ead_reset() {
        $container.show();
        $embedurl.val('');
        $('.ead-options').fadeIn();
        $('.addurl_box').hide();
        $('.upload-success').hide();
        $('#embed_message').hide();
        $('#insert_doc').attr('disabled', 'disabled');
        $('#new_provider').show();
        $('#ead_pseudo').hide();
        newprovider = "";
        $("#new_provider  option[value='microsoft']").attr('disabled', false);
        $('#ead_downloadc').show();
    }
    //Opens Embed popup
    $('body').on('click', '.awsm-embed', function(e) {
        ead_reset();
        e.preventDefault();
        $('body').addClass('ead-popup-on');
        tb_show("Embed Any Document", "#TB_inline?inlineId=embed-popup-wrap&amp;width=1030&amp;modal=true", null);
        tb_position();
        return;
    });
    //sanitize width and height
    function sanitize(dim) {
        if (dim.indexOf("%") == -1) {
            dim = dim.replace(/[^0-9]/g, '');
            dim += "px";
        } else {
            dim = dim.replace(/[^0-9]/g, '');
            dim += "%";
        }
        return dim;
    }
    //Thickbox Handler
    function tb_position() {
            var tbWindow = $('#TB_window');
            var width = $(window).width();
            var H = $(window).height();
            var W = ( 1080 < width ) ? 1080 : width;

            if ( tbWindow.size() ) {
                tbWindow.width( W - 50 ).height( H - 45 );
                //$('#TB_iframeContent').width( W - 50 ).height( H - 75 );
                $('#TB_ajaxContent').css({'width':'100%','height':'100%','padding':'0'});
                tbWindow.css({'margin-left': '-' + parseInt((( W - 50 ) / 2),10) + 'px'});
                if ( typeof document.body.style.maxWidth != 'undefined' )
                    tbWindow.css({'top':'20px','margin-top':'0'});
                $('#TB_title').css({'background-color':'#fff','color':'#cfcfcf'});
            };
    };
    //Update shortcode on change
    $(".ead_usc").change(function() {
        newprovider = "";
        updateshortcode($(this).attr('id'));
    });
    $('.embedval').keyup(function() {
        updateshortcode($(this).attr('id'));
    });
    //Wordpress Uploader
    $('#upload_doc').click(open_media_window);
    //Insert Media window
    function open_media_window() {
        var uClass = 'upload';
        if (frame) {
            frame.open();
            return;
        }
        frame = wp.media({
            title: 'Embed Any Document',
            multiple: false,
            library: {
                type: emebeder.validtypes,
            },
            button: {
                text: 'Insert'
            }
        });
        frame.on('select', function() {
            var file = frame.state().get('selection').first().toJSON();
            updateprovider(file, uClass);
        });
        frame.open();
    }
    //update provider
    function updateprovider(file, uClass) {
        fileurl = file.url;
        validViewer(file, uClass);
        updateshortcode();
        uploaddetails(file, uClass);
    }
    //to getshortcode
    function getshortcode(url, item) {
        var height = sanitize($('#ead_height').val()),
            width = sanitize($('#ead_width').val()),
            download = $('#ead_download').val(),
            provider = $('#ead_provider').val(),
            heightstr = "",
            widthstr = "",
            downloadstr = "",
            providerstr = "",
            drivestr = "";
        if (itemcheck('height', item)) {
            heightstr = ' height="' + height + '"';
        }
        if (itemcheck('width', item)) {
            widthstr = ' width="' + width + '"';
        }
        if (itemcheck('download', item)) {
            downloadstr = ' download="' + download + '"';
        }
        if (itemcheck('provider', item)) {
            providerstr = ' viewer="' + provider + '"';
        }
        if (newprovider) {
            providerstr = ' viewer="' + newprovider + '"';
        }
        return '[embeddoc url="' + url + '"' + widthstr + heightstr + downloadstr + providerstr + drivestr + ']';
    }
    // Checks with default setting value
    function itemcheck(item, dataitem) {
        var check = $('#ead_' + item).val();
        var datacheck = 'ead_' + item;
        if (datacheck == dataitem) {
            return true;
        } else if (check != emebeder[item]) {
            return true;
        }
        return false;
    }
    //Print uploaded file details
    function uploaddetails(file, uClass) {
        $('#insert_doc').removeAttr('disabled');
        $('#ead_filename').html(file.filename);
        if (file.filesizeHumanReadable) {
            $('#ead_filesize').html(file.filesizeHumanReadable);
        } else {
            $('#ead_filesize').html('&nbsp;');
        }
        $('.upload-success').fadeIn();
        $container.hide();
        UploadClass(uClass);
    }
    //Add url
    $('#add_url').click(awsm_embded_url);

    function awsm_embded_url() {
        var checkurl = $embedurl.val();
        if (checkurl !== '') {
            validateurl(checkurl);
        } else {
            $embedurl.addClass('urlerror');
            updateshortcode();
        }
    }
    //Validate file url
    function validateurl(url) {
        var uClass = 'link';
        $('#embed_message').hide();
        $('#add_url').val(emebeder.verify);
        $.ajax({
            type: 'POST',
            url: emebeder.ajaxurl,
            dataType: 'json',
            data: {
                action: 'validateurl',
                furl: url
            },
            success: function(data) {
                if (data.status) {
                    $embedurl.removeClass('urlerror');
                    updateprovider(data.file, uClass);
                } else {
                    showmsg(data.message);
                }
                $('#add_url').val(emebeder.addurl);
            },
        });
    }
    //Show Message
    function showmsg(msg) {
        $('#embed_message').fadeIn();
        $message.text(msg);
    }
    //insert Shortcode
    $('#insert_doc').click(awsm_shortcode);

    function awsm_shortcode() {
        if (fileurl) {
            wp.media.editor.insert($shortcode.text());
            remove_eadpop();
        } else {
            showmsg(emebeder.nocontent);
        }
    }
    // Add from URL support
    $('#addDocUrl').on('click', function(e) {
        e.preventDefault();
        $('.addurl_box').fadeIn();
        $('.ead-options').hide();
    });
    //Add fromrom URL cancel handler
    $('.go-back').on('click', function(e) {
        e.preventDefault();
        $('.addurl_box').hide();
        $('.ead-options').fadeIn();
    });
    //Update ShortCode
    function updateshortcode(item) {
        item = typeof item !== 'undefined' ? item : false;
        if (fileurl) {
            $shortcode.text(getshortcode(fileurl, item));
        } else {
            $shortcode.text('');
        }
    }
    // Close embed dialog
    $('#embed-popup').on('click', '.cancel_embed,.mfp-close', function(e) {
        // Prevent default action
        e.preventDefault();
        remove_eadpop();
    });
    //UploadClass
    function UploadClass(uPclass) {
        $(".uploaded-doccument").removeClass("ead-link ead-upload ead-dropbox ead-drive ead-box");
        $('.uploaded-doccument').addClass('ead-' + uPclass);
    }
    //close popup
    function remove_eadpop(){
        // Close popup
        tb_remove();
        setTimeout(function() {
           $('body').removeClass('ead-popup-on');
        }, 800);
    }
    //Convert Filesize to human Readable filesize
    function humanFileSize(bytes) {
        var thresh = 1024;
        if (bytes < thresh) return bytes + ' B';
        var units = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (bytes >= thresh);
        return bytes.toFixed(1) + ' ' + units[u];
    }
    // Viewer Check
    function validViewer(file, provider) {
        var cprovider = ["link", "upload"];
        var validext = msextension.split(',');
        var ext = '.' + file.filename.split('.').pop();
        $("#new_provider  option[value='microsoft']").attr('disabled', false);
        if ($.inArray(provider, cprovider) != -1) {
            if ($.inArray(ext, validext) == -1) {
                newprovider = "google";
                $("#new_provider option[value='google']").attr("selected", "selected");
                $("#new_provider  option[value='microsoft']").attr('disabled', true);
            } else {
                newprovider = "microsoft";
                $("#new_provider option[value='microsoft']").attr("selected", "selected");
            }
        }
    }
});