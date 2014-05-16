// init i18next
i18n.init({
    resGetPath: "/locales/resources.json?lng=__lng__&ns=__ns__",
    resPostPath: '/locales/add/__lng__/__ns__',
    sendType: 'POST', // POST|GET default: POST
    dynamicLoad: true, // must use this, or the resStore will has the wrong struct
    sendMissing: true,
    sendMissingTo: 'all',
    supportedLngs: ['en', 'zh'],
    ns: {
        namespaces: ['app', 'btn', 'msg'], //设定命名空间，用来区分不同用途的翻译信息。
        defaultNs: 'app'
    },
    preload: ['en', 'zh'],
    fallbackLng: 'en',
    getAsync: false, // 用同步的方式来获取翻译资源信息
});
$(document).ready(function() {
    // IE mode
    var isRTL = false;
    var isIE8 = false;
    var isIE9 = false;
    var isIE10 = false;

    var sidebarWidth = 225;
    var sidebarCollapsedWidth = 35;
    var responsiveHandlers = [];
    //defination of init functions
    var handleInit = function() {

        if ($('body').css('direction') === 'rtl') {
            isRTL = true;
        }

        isIE8 = !! navigator.userAgent.match(/MSIE 8.0/);
        isIE9 = !! navigator.userAgent.match(/MSIE 9.0/);
        isIE10 = !! navigator.userAgent.match(/MSIE 10/);

        if (isIE10) {
            jQuery('html').addClass('ie10'); // detect IE10 version
        }
    };
    var handleResponsiveOnResize = function() {
        var resize;
        if (isIE8) {
            var currheight;
            $(window).resize(function() {
                if (currheight == document.documentElement.clientHeight) {
                    return; //quite event since only body resized not window.
                }
                if (resize) {
                    clearTimeout(resize);
                }
                resize = setTimeout(function() {
                    handleResponsive();
                }, 50); // wait 50ms until window resize finishes.                
                currheight = document.documentElement.clientHeight; // store last body client height
            });
        } else {
            $(window).resize(function() {
                if (resize) {
                    clearTimeout(resize);
                }
                resize = setTimeout(function() {
                    //console.log('resize');
                    handleResponsive();
                }, 50); // wait 50ms until window resize finishes.
            });
        }
    };
    var handleResponsive = function() {
        handleTooltips();
        handleSidebarState();
        handleDesktopTabletContents();
        handleSidebarAndContentHeight();
        handleChoosenSelect();
        handleFixedSidebar();
        runResponsiveHandlers();
    };
    var handleUniform = function() {
        if (!jQuery().uniform) {
            return;
        }
        var test = $("input[type=checkbox]:not(.toggle), input[type=radio]:not(.toggle, .star)");
        if (test.size() > 0) {
            test.each(function() {
                if ($(this).parents(".checker").size() == 0) {
                    $(this).show();
                    $(this).uniform();
                }
            });
        }
    };
    var handleScrollers = function() {
        $('.scroller').each(function() {
            $(this).slimScroll({
                size: '7px',
                color: '#a1b2bd',
                position: isRTL ? 'left' : 'right',
                height: $(this).attr("data-height"),
                alwaysVisible: ($(this).attr("data-always-visible") == "1" ? true : false),
                railVisible: ($(this).attr("data-rail-visible") == "1" ? true : false),
                disableFadeOut: true
            });
        });
    };
    var handleResponsiveOnInit = function() {
        handleSidebarState(); // <-
        handleDesktopTabletContents();
        handleSidebarAndContentHeight();
    };
    var handleFixedSidebar = function() {
        var menu = $('.page-sidebar-menu');

        if (menu.parent('.slimScrollDiv').size() === 1) { // destroy existing instance before updating the height
            menu.slimScroll({
                destroy: true
            });
            menu.removeAttr('style');
            $('.page-sidebar').removeAttr('style');
        }

        if ($('.page-sidebar-fixed').size() === 0) {
            handleSidebarAndContentHeight();
            return;
        }

        if ($(window).width() >= 980) {
            var sidebarHeight = _calculateFixedSidebarViewportHeight();

            menu.slimScroll({
                size: '7px',
                color: '#a1b2bd',
                opacity: .3,
                position: isRTL ? 'left' : ($('.page-sidebar-on-right').size() === 1 ? 'left' : 'right'),
                height: sidebarHeight,
                allowPageScroll: false,
                disableFadeOut: false
            });
            handleSidebarAndContentHeight();
        }
    };

    var handleFixedSidebarHoverable = function() {
        if ($('body').hasClass('page-sidebar-fixed') === false) {
            return;
        }

        $('.page-sidebar').off('mouseenter').on('mouseenter', function() {
            var body = $('body');

            if ((body.hasClass('page-sidebar-closed') === false || body.hasClass('page-sidebar-fixed') === false) || $(this).hasClass('page-sidebar-hovering')) {
                return;
            }

            body.removeClass('page-sidebar-closed').addClass('page-sidebar-hover-on');
            $(this).addClass('page-sidebar-hovering');
            $(this).animate({
                width: sidebarWidth
            }, 100, '', function() {
                $(this).removeClass('page-sidebar-hovering');
            });
        });

        $('.page-sidebar').off('mouseleave').on('mouseleave', function() {
            var body = $('body');

            if ((body.hasClass('page-sidebar-hover-on') === false || body.hasClass('page-sidebar-fixed') === false) || $(this).hasClass('page-sidebar-hovering')) {
                return;
            }

            $(this).addClass('page-sidebar-hovering');
            $(this).animate({
                width: sidebarCollapsedWidth
            }, 100, '', function() {
                $('body').addClass('page-sidebar-closed').removeClass('page-sidebar-hover-on');
                $(this).removeClass('page-sidebar-hovering');
            });
        });
    };
    var handleSidebarMenu = function() {
        jQuery('.page-sidebar').on('click', 'li > a', function(e) {
            if ($(this).next().hasClass('sub-menu') == false) {
                if ($('.btn-navbar').hasClass('collapsed') == false) {
                    $('.btn-navbar').click();
                }
                return;
            }

            var parent = $(this).parent().parent();

            parent.children('li.open').children('a').children('.arrow').removeClass('open');
            parent.children('li.open').children('.sub-menu').slideUp(50);
            parent.children('li.open').removeClass('open');

            var sub = jQuery(this).next();
            if (sub.is(":visible")) {
                jQuery('.arrow', jQuery(this)).removeClass("open");
                jQuery(this).parent().removeClass("open");
                sub.slideUp(50, function() {
                    handleSidebarAndContentHeight();
                });
            } else {
                jQuery('.arrow', jQuery(this)).addClass("open");
                jQuery(this).parent().addClass("open");
                sub.slideDown(50, function() {
                    handleSidebarAndContentHeight();
                });
            }
            // $.removeCookie('opend-mis', {
            //     path: '/'
            // });
            //save open item id into cookie
            var open_items = "";
            _.each($('li[class*="open"]'), function(x) {
                open_items += "#" + $(x).attr('id') + ",";
            })
            $.cookie('opend-mis', open_items, {
                path: '/'
            });
            // console.log(open_items);
            // console.log($('li[class*="open"]').attr('id'));
            e.preventDefault();
        });

        // handle ajax links
        jQuery('.page-sidebar').on('click', ' li > a.ajaxify', function(e) {
            e.preventDefault();
            scrollTop();

            var url = $(this).attr("href");
            var menuContainer = jQuery('.page-sidebar ul');
            var pageContent = $('.page-content');
            var pageContentBody = $('.page-content .page-content-body');

            menuContainer.children('li.active').removeClass('active');
            menuContainer.children('arrow.open').removeClass('open');

            $(this).parents('li').each(function() {
                $(this).addClass('active');
                $(this).children('a > span.arrow').addClass('open');
            });
            $(this).parents('li').addClass('active');

            blockUI(pageContent, false);

            $.post(url, {}, function(res) {
                unblockUI(pageContent);
                pageContentBody.html(res);
                fixContentHeight(); // fix content height
                initUniform(); // initialize uniform elements
            });
        });
    };
    var handleHorizontalMenu = function() {
        //handle hor menu search form toggler click
        $('.header').on('click', '.hor-menu .hor-menu-search-form-toggler', function(e) {
            if ($(this).hasClass('hide')) {
                $(this).removeClass('hide');
                $('.header .hor-menu .search-form').hide();
            } else {
                $(this).addClass('hide');
                $('.header .hor-menu .search-form').show();
            }
            e.preventDefault();
        });

        //handle hor menu search button click
        $('.header').on('click', '.hor-menu .search-form .btn', function(e) {
            window.location.href = "extra_search.html";
            e.preventDefault();
        });

        //handle hor menu search form on enter press
        $('.header').on('keypress', '.hor-menu .search-form input', function(e) {
            if (e.which == 13) {
                window.location.href = "extra_search.html";
                return false;
            }
        });
    };

    var handleSidebarToggler = function() {
        // restore sidebar state from cookie
        if ($.cookie('page-sidebar') == 'closed') {
            $('body').addClass("page-sidebar-closed");
        };
        // handle sidebar show/hide
        $('.page-sidebar').on('click', '.sidebar-toggler', function(e) {
            var body = $('body');
            var sidebar = $('.page-sidebar');

            if ((body.hasClass("page-sidebar-hover-on") && body.hasClass('page-sidebar-fixed')) || sidebar.hasClass('page-sidebar-hovering')) {
                body.removeClass('page-sidebar-hover-on');
                sidebar.css('width', '').hide().show();
                e.stopPropagation();
                runResponsiveHandlers();
                return;
            }

            $(".sidebar-search", sidebar).removeClass("open");

            if (body.hasClass("page-sidebar-closed")) {
                body.removeClass("page-sidebar-closed");
                if (body.hasClass('page-sidebar-fixed')) {
                    sidebar.css('width', '');
                }
                //update cookie
                $.cookie('page-sidebar', 'open', {
                    path: '/'
                });
            } else {
                body.addClass("page-sidebar-closed");
                //update cookie
                $.cookie('page-sidebar', 'closed', {
                    path: '/'
                });
            }
            runResponsiveHandlers();
            body.trigger('resize');
        });

        // handle the search bar close
        $('.page-sidebar').on('click', '.sidebar-search .remove', function(e) {
            e.preventDefault();
            $('.sidebar-search').removeClass("open");
        });

        // handle the search query submit on enter press
        $('.page-sidebar').on('keypress', '.sidebar-search input', function(e) {
            if (e.which == 13) {
                window.location.href = "extra_search.html";
                return false; //<---- Add this line
            }
        });

        // handle the search submit
        $('.sidebar-search .submit').on('click', function(e) {
            e.preventDefault();

            if ($('body').hasClass("page-sidebar-closed")) {
                if ($('.sidebar-search').hasClass('open') == false) {
                    if ($('.page-sidebar-fixed').size() === 1) {
                        $('.page-sidebar .sidebar-toggler').click(); //trigger sidebar toggle button
                    }
                    $('.sidebar-search').addClass("open");
                } else {
                    window.location.href = "extra_search.html";
                }
            } else {
                window.location.href = "extra_search.html";
            }
        });
    }
    var handleFixInputPlaceholderForIE = function() {
        //fix html5 placeholder attribute for ie7 & ie8
        if (isIE8 || isIE9) { // ie7&ie8
            // this is html5 placeholder fix for inputs, inputs with placeholder-no-fix class will be skipped(e.g: we need this for password fields)
            jQuery('input[placeholder]:not(.placeholder-no-fix), textarea[placeholder]:not(.placeholder-no-fix)').each(function() {

                var input = jQuery(this);

                if (input.val() == '' && input.attr("placeholder") != '') {
                    input.addClass("placeholder").val(input.attr('placeholder'));
                }

                input.focus(function() {
                    if (input.val() == input.attr('placeholder')) {
                        input.val('');
                    }
                });

                input.blur(function() {
                    if (input.val() == '' || input.val() == input.attr('placeholder')) {
                        input.val(input.attr('placeholder'));
                    }
                });
            });
        }
    }
    var handleGoTop = function() {
        /* set variables locally for increased performance */
        jQuery('.footer').on('click', '.go-top', function(e) {
            scrollTo();
            e.preventDefault();
        });
    }
    var handleTheme = function() {

        var panel = $('.color-panel');

        if ($('body').hasClass('page-boxed') == false) {
            $('.layout-option', panel).val("fluid");
        }

        $('.sidebar-option', panel).val("default");
        $('.header-option', panel).val("fixed");
        $('.footer-option', panel).val("default");

        //handle theme layout
        var resetLayout = function() {
            $("body").
            removeClass("page-boxed").
            removeClass("page-footer-fixed").
            removeClass("page-sidebar-fixed").
            removeClass("page-header-fixed");

            $('.header > .navbar-inner > .container').removeClass("container").addClass("container-fluid");

            if ($('.page-container').parent(".container").size() === 1) {
                $('.page-container').insertAfter('.header');
            }

            if ($('.footer > .container').size() === 1) {
                $('.footer').html($('.footer > .container').html());
            } else if ($('.footer').parent(".container").size() === 1) {
                $('.footer').insertAfter('.page-container');
            }

            $('body > .container').remove();
        }

        var lastSelectedLayout = '';

        var setLayout = function() {

            var layoutOption = $('.layout-option', panel).val();
            var sidebarOption = $('.sidebar-option', panel).val();
            var headerOption = $('.header-option', panel).val();
            var footerOption = $('.footer-option', panel).val();

            if (sidebarOption == "fixed" && headerOption == "default") {
                // alert('Default Header with Fixed Sidebar option is not supported. Proceed with Default Header with Default Sidebar.');
                alert('不支持默认样式的页眉与固定样式的侧边栏选项');
                $('.sidebar-option', panel).val("default");
                sidebarOption = 'default';
            }

            resetLayout(); // reset layout to default state

            if (layoutOption === "boxed") {
                $("body").addClass("page-boxed");

                // set header
                $('.header > .navbar-inner > .container-fluid').removeClass("container-fluid").addClass("container");
                var cont = $('.header').after('<div class="container"></div>');

                // set content
                $('.page-container').appendTo('body > .container');

                // set footer
                if (footerOption === 'fixed' || sidebarOption === 'default') {
                    $('.footer').html('<div class="container">' + $('.footer').html() + '</div>');
                } else {
                    $('.footer').appendTo('body > .container');
                }
            }

            if (lastSelectedLayout != layoutOption) {
                //layout changed, run responsive handler:
                runResponsiveHandlers();
            }
            lastSelectedLayout = layoutOption;

            //header
            if (headerOption === 'fixed') {
                $("body").addClass("page-header-fixed");
                $(".header").removeClass("navbar-static-top").addClass("navbar-fixed-top");
            } else {
                $("body").removeClass("page-header-fixed");
                $(".header").removeClass("navbar-fixed-top").addClass("navbar-static-top");
            }

            //sidebar
            if (sidebarOption === 'fixed') {
                $("body").addClass("page-sidebar-fixed");
            } else {
                $("body").removeClass("page-sidebar-fixed");
            }
            handleFixedSidebar(); // reinitialize fixed sidebar
            handleFixedSidebarHoverable(); // reinitialize fixed sidebar hover effect

            //footer 
            if (footerOption === 'fixed') {
                $("body").addClass("page-footer-fixed");
            } else {
                $("body").removeClass("page-footer-fixed");
            }

            handleSidebarAndContentHeight(); // fix content height
        }

        // handle theme colors
        var setColor = function(color) {
            $('#style_color').attr("href", "/assets/css/themes/" + color + ".css");
            $.cookie('style_color', color);
        }

        $('.icon-color', panel).click(function() {
            $('.color-mode').show();
            $('.icon-color-close').show();
        });

        $('.icon-color-close', panel).click(function() {
            $('.color-mode').hide();
            $('.icon-color-close').hide();
        });

        $('li', panel).click(function() {
            var color = $(this).attr("data-style");
            setColor(color);
            $('.inline li', panel).removeClass("current");
            $(this).addClass("current");
        });

        $('.layout-option, .header-option, .sidebar-option, .footer-option', panel).change(setLayout);
    }
    var handlePortletTools = function() {
        jQuery('body').on('click', '.portlet .tools a.remove', function(e) {
            e.preventDefault();
            var removable = jQuery(this).parents(".portlet");
            if (removable.next().hasClass('portlet') || removable.prev().hasClass('portlet')) {
                jQuery(this).parents(".portlet").remove();
            } else {
                jQuery(this).parents(".portlet").parent().remove();
            }
        });

        jQuery('body').on('click', '.portlet .tools a.reload', function(e) {
            e.preventDefault();
            var el = jQuery(this).parents(".portlet");
            blockUI(el);
            //在这里写重新加载数据的代码
            window.setTimeout(function() {
                unblockUI(el);
            }, 1000);
        });

        jQuery('body').on('click', '.portlet .tools .collapse, .portlet .tools .expand', function(e) {
            e.preventDefault();
            var el = jQuery(this).closest(".portlet").children(".portlet-body");
            if (jQuery(this).hasClass("collapse")) {
                jQuery(this).removeClass("collapse").addClass("expand");
                el.slideUp(200);
            } else {
                jQuery(this).removeClass("expand").addClass("collapse");
                el.slideDown(200);
            }
        });
    }
    var handleDropdowns = function() {
        jQuery('body').on('click', '.dropdown-menu.hold-on-click', function(e) {
            e.stopPropagation();
        })
    }
    var handleTabs = function() {

        // function to fix left/right tab contents
        var fixTabHeight = function(tab) {
            $(tab).each(function() {
                var content = $($($(this).attr("href")));
                var tab = $(this).parent().parent();
                if (tab.height() > content.height()) {
                    content.css('min-height', tab.height());
                }
            });
        }

        // fix tab content on tab shown
        $('body').on('shown', '.nav.nav-tabs.tabs-left a[data-toggle="tab"], .nav.nav-tabs.tabs-right a[data-toggle="tab"]', function() {
            fixTabHeight($(this));
        });

        $('body').on('shown', '.nav.nav-tabs', function() {
            handleSidebarAndContentHeight();
        });

        //fix tab contents for left/right tabs
        fixTabHeight('.nav.nav-tabs.tabs-left > li.active > a[data-toggle="tab"], .nav.nav-tabs.tabs-right > li.active > a[data-toggle="tab"]');

        //activate tab if tab id provided in the URL
        if (location.hash) {
            var tabid = location.hash.substr(1);
            $('a[href="#' + tabid + '"]').click();
        }
    }
    var handleTooltips = function() {
        if (isTouchDevice()) { // if touch device, some tooltips can be skipped in order to not conflict with click events
            jQuery('.tooltips:not(.no-tooltip-on-touch-device)').tooltip();
        } else {
            jQuery('.tooltips').tooltip();
        }
    }
    var handlePopovers = function() {
        jQuery('.popovers').popover();
    };

    var handleAccordions = function() {
        $(".accordion").collapse().height('auto');

        var lastClicked;

        //add scrollable class name if you need scrollable panes
        jQuery('body').on('click', '.accordion.scrollable .accordion-toggle', function() {
            lastClicked = jQuery(this);
        }); //move to faq section

        jQuery('body').on('shown', '.accordion.scrollable', function() {
            jQuery('html,body').animate({
                scrollTop: lastClicked.offset().top - 150
            }, 'slow');
        });
    };
    var handleChoosenSelect = function() {
        if (!jQuery().chosen) {
            return;
        }

        $(".chosen").each(function() {
            $(this).chosen({
                allow_single_deselect: $(this).attr("data-with-diselect") === "1" ? true : false
            });
        });
    };

    var handleDesktopTabletContents = function() {
        // loops all page elements with "responsive" class and applies classes for tablet mode
        // For metornic  1280px or less set as tablet mode to display the content properly
        if ($(window).width() <= 1280 || $('body').hasClass('page-boxed')) {
            $(".responsive").each(function() {
                var forTablet = $(this).attr('data-tablet');
                var forDesktop = $(this).attr('data-desktop');
                if (forTablet) {
                    $(this).removeClass(forDesktop);
                    $(this).addClass(forTablet);
                }
            });
        }

        // loops all page elements with "responsive" class and applied classes for desktop mode
        // For metornic  higher 1280px set as desktop mode to display the content properly
        if ($(window).width() > 1280 && $('body').hasClass('page-boxed') === false) {
            $(".responsive").each(function() {
                var forTablet = $(this).attr('data-tablet');
                var forDesktop = $(this).attr('data-desktop');
                if (forTablet) {
                    $(this).removeClass(forTablet);
                    $(this).addClass(forDesktop);
                }
            });
        }
    };

    var handleSidebarState = function() {
        // remove sidebar toggler if window width smaller than 900(for table and phone mode)
        if ($(window).width() < 980) {
            $('body').removeClass("page-sidebar-closed");
        }
    }
    var handleSidebarAndContentHeight = function() {
        var content = $('.page-content');
        var sidebar = $('.page-sidebar');
        var body = $('body');
        var height;

        if (body.hasClass("page-footer-fixed") === true && body.hasClass("page-sidebar-fixed") === false) {
            var available_height = $(window).height() - $('.footer').height();
            if (content.height() < available_height) {
                content.attr('style', 'min-height:' + available_height + 'px !important');
            }
        } else {
            if (body.hasClass('page-sidebar-fixed')) {
                height = _calculateFixedSidebarViewportHeight();
            } else {
                height = sidebar.height() + 20;
            }
            if (height >= content.height()) {
                content.attr('style', 'min-height:' + height + 'px !important');
            }
        }
    }
    var runResponsiveHandlers = function() {
        // reinitialize other subscribed elements
        for (var i in responsiveHandlers) {
            var each = responsiveHandlers[i];
            each.call();
        }
    }

    var isTouchDevice = function() {
        try {
            document.createEvent("TouchEvent");
            return true;
        } catch (e) {
            return false;
        }
    };
    var fixContentHeight = function() {
        handleSidebarAndContentHeight();
    };

    var addResponsiveHandler = function(func) {
        responsiveHandlers.push(func);
    };
    // useful function to make equal height for contacts stand side by side
    var setEqualHeight = function(els) {
        var tallestEl = 0;
        els = jQuery(els);
        els.each(function() {
            var currentHeight = $(this).height();
            if (currentHeight > tallestEl) {
                tallestColumn = currentHeight;
            }
        });
        els.height(tallestEl);
    };

    // wrapper function to scroll to an element
    var scrollTo = function(el, offeset) {
        pos = el ? el.offset().top : 0;
        jQuery('html,body').animate({
            scrollTop: pos + (offeset ? offeset : 0)
        }, 'slow');
    };

    var scrollTop = function() {
        scrollTo();
    };

    // wrapper function to  block element(indicate loading)
    var blockUI = function(el, centerY) {
        var el = jQuery(el);
        el.block({
            message: '<img src="/assets/img/ajax-loading.gif" align="">',
            centerY: centerY != undefined ? centerY : true,
            css: {
                top: '10%',
                border: 'none',
                padding: '2px',
                backgroundColor: 'none'
            },
            overlayCSS: {
                backgroundColor: '#000',
                opacity: 0.05,
                cursor: 'wait'
            }
        });
    };

    // wrapper function to  un-block element(finish loading)
    var unblockUI = function(el) {
        jQuery(el).unblock({
            onUnblock: function() {
                jQuery(el).removeAttr("style");
            }
        });
    };
    //core handlers
    handleInit();
    handleResponsiveOnResize(); // set and handle responsive    
    handleUniform();
    handleScrollers(); // handles slim scrolling contents 
    handleResponsiveOnInit(); // handler responsive elements on page load

    //layout handlers
    handleFixedSidebar(); // handles fixed sidebar menu
    handleFixedSidebarHoverable(); // handles fixed sidebar on hover effect 
    handleSidebarMenu(); // handles main menu
    handleHorizontalMenu(); // handles horizontal menu
    handleSidebarToggler(); // handles sidebar hide/show            
    handleFixInputPlaceholderForIE(); // fixes/enables html5 placeholder attribute for IE9, IE8
    handleGoTop(); //handles scroll to top functionality in the footer
    handleTheme(); // handles style customer tool

    //restore menu open state from cookie
    if ($.cookie('opend-mis')) {
        _.each($.cookie('opend-mis').split(','), function(x) {
            $(x + ' > a').click();
        })
        $(_.compact($.cookie('opend-mis').split(',')).join(',')).click();
    };
    //ui component handlers
    handlePortletTools(); // handles portlet action bar functionality(refresh, configure, toggle, remove)
    handleDropdowns(); // handle dropdowns
    handleTabs(); // handle tabs
    handleTooltips(); // handle bootstrap tooltips
    handlePopovers(); // handles bootstrap popovers
    handleAccordions(); //handles accordions
    handleChoosenSelect(); // handles bootstrap chosen dropdowns 

    $(".btn_del_favorite_url").on('click', function(e) {
        e.preventDefault();
        var $this = $(this);
        var title = $this.data('ftitle');
        var url = $this.data('furl');
        $.post('/admin/user/remove_from_favorite_url', {
            title: title,
            url: url
        }, function(data) {
            if (data.code == 'OK') {
                alert(data.msg);
                $(e.srcElement).parent().parent().parent().remove();
            };
        })

    })

    // custom validator
    if ($.validator) {
        $.validator.addMethod("required_hidden", function(value, element, param) {
            return !!param.val();
        });
        $.validator.addMethod("compareDate", function(value, element, param) {
            var startDate = jQuery(param).val();

            if (startDate == "" || value == "____-__-__") {
                return true;
            }
            var date1 = new Date(Date.parse(startDate));
            var date2 = new Date(Date.parse(value));
            return date1 <= date2;
        });
        $.validator.addMethod("idCardNo", function(value, element) {
            var length = value.length;
            if (length == 15 || length == 18) {
                return true;
            } else {
                return false;
            }
        });
    };

    // start clock
    $("#digital_clock").clock({
        "langSet": i18n.lng()
    })
    hide_ajax_loader_s();
    $("a, button, input, i, th, td").tooltip();

    // $(".fstextarea").fseditor();
    // set moment lng
    // moment.lang('zh');
    // get task todo list
    $.get('/admin/wf/todo_list/json', function(data) {

        var objs = [];
        if (_.isArray(data.tis) && data.tis.length > 0) {
            _.each(data.tis, function(x) {
                var obj = {};
                obj.sort = moment().diff(moment(x.task_create).add('days', x.task_define.due_date), "days");
                obj.title = '<span class="desc">' + (x.process_instance ? x.process_instance.process_instance_name : '') + '</span></br><span class="desc" style="color:green">[' + x.task_name + ']</span>';
                obj.operation = 'onclick="userprocess_ti(%'' + x._id + '%')"';
                objs.push(obj);
            })
        }
        if (_.isArray(data.qis) && data.qis.length > 0) {
            var people_id = $("#login_people").val() ? $("#login_people").val() : $("#people_id").val();
            if ( !! people_id) {
                var qiss = [];
                var qtc = _.groupBy(data.qis, function(x) {
                    return x.qtc._id;
                });

                qtcs = _.keys(qtc);

                //查找360测评问卷
                _.each(qtcs, function(xx) {

                    var qts = qtc[xx];
                    //根据测评周期分组
                    var qtcs1 = _.groupBy(qts, function(obj) {
                        return obj.period;
                    });
                    var qtcs1_ids = _.keys(qtcs1);

                    _.each(qtcs1_ids, function(xxx) {
                        var b = false;
                        _.each(qtcs1[xxx], function(q) {
                            _.each(q.dimensions, function(x) {
                                _.each(x.items, function(xx) {
                                    _.each(xx.qtis, function(qq) {
                                        var people = _.find(qq.peoples, function(qqp) {
                                            return qqp.people == people_id && qqp.status == '0';
                                        });
                                        if (people) {
                                            b = true;
                                        }
                                    });
                                });
                            });
                        });
                        if (b) {
                            qiss.push(qtcs1[xxx][0]);
                        }
                    });
                });

                _.each(qiss, function(q) {
                    var obj = {};
                    obj.sort = moment().diff(moment(q.lastDate), "days");
                    obj.title = '<span class="desc">' + q.qtc.qt_name + '</span>';
                    obj.operation = 'onclick="go_grade(%'' + q.qtc._id + '-' + q.period + '%');" ';
                    objs.push(obj);
                });
            }
        }
        if (_.isArray(data.common_qis) && data.common_qis.length > 0) {
            _.each(data.common_qis, function(q) {
                var obj = {};
                obj.sort = moment().diff(moment(q.lastDate), "days");
                obj.title = '<span class="desc">' + q.qtc.qt_name + '</span>';
                obj.operation = 'onclick="go_common_grade(%'' + q._id + '%', %'' + q.qtc.questionnair_category + '%');" ';
                objs.push(obj);
            })
        }
        objs = _.sortBy(objs, function(obj) {
            return -(parseInt(obj.sort));
        });

        for (var i = 0; i < objs.length; i++) { //下拉显示最新的5条
            if (i >= 5) {
                break;
            };
            var obj = objs[i];
            var tr_topline = []; //首页导航显示
            tr_topline.push('<a ');
            tr_topline.push(obj.operation);
            tr_topline.push('>');
            tr_topline.push('<span class="task">');
            tr_topline.push(obj.title)
            tr_topline.push('</span>');
            tr_topline.push('</a>');
            $("#usertask").append($(tr_topline.join('')));
        };
        if (objs.length) {
            $("#counttask p").html("您有 " + objs.length + " 个待办任务"); //首页导航显示待办任务总数
        } else {
            $("#counttask p").html("您没有待办任务"); //首页导航显示待办任务总数
        };

        $("#sscounttask").html(objs.length); //
    })
    $.get('/admin/im/list_user_json', function(data) {
        data = _.sortBy(data, function(x) {
            return - (new Date(x.s_date));
        })
        for (var i = 0; i < data.length; i++) {
            if (i >= 5) {
                break;
            };
            var x = data[i];
            var tr_topline = []; //首页导航显示
            tr_topline.push('<a  href="/admin/im/view/' + x.id + '" >');
            tr_topline.push('<span class="photo">');
            if (x.avatar) {
                tr_topline.push('<img src="/gridfs/get/' + x.avatar + ' ">');
            } else {
                tr_topline.push('<img src="/img/no-avatar.jpg">');
            }
            tr_topline.push('</span>');
            tr_topline.push('<span class="subject">')
            tr_topline.push('<span class="from">' + x.user_name + '</span>')
            tr_topline.push('<span class="time">' + moment(x.s_date).fromNow() + '</span>')
            tr_topline.push('</span>')
            tr_topline.push('<span class="message" style="color:green">' + x.msg_theme + '</span>');
            tr_topline.push('</span>');
            tr_topline.push('</a>');
            $("#usermsg").append($(tr_topline.join('')));
        };
        $("#countmsg p").html("您有<span style='color:red'> " + data.length + "</span> 条通知"); //首页导航显示待办任务总数
        $("#msg_length").html(data.length); //
    })
    //挂接流程菜单
    $.get('/admin/wf/process_define/gen_menu_data', function(data) {
        if (_.isArray(data) && data.length > 0) {
            _.each(data, function(x) {
                var menu_item = [];
                menu_item.push('<li>')
                menu_item.push('<a href="' + x.url + '">')
                menu_item.push('<i class="' + x.icon + '"></i>');
                menu_item.push(x.title)
                menu_item.push('</a>')
                menu_item.push('</li>')
                // var hook_menu = $("#" + x.hook_menu + ' ul');
                // if (hook_menu.length == 0) { // 空的没有ul
                //     $("#" + x.hook_menu).append('<ul class="sub-menu"></ul>')
                // };
                $("#" + x.hook_menu + ' ul').append(menu_item.join(''));
            })
        }
    })
});
var sound_ok = '/assets/sounds/ok.wav';
var sound_err = '/assets/sounds/err.wav';

function show_notify_msg(msg, type, fadeout) {
    $("#notify_message").show();

    if ('OK' == type) {
        var audio = new Audio(sound_ok);
        audio.play();
        $("#nm_icon").removeClass('text-error').addClass('text-info').html('<i class="icon-info"></i>');
        $("#nm_text").removeClass('text-error').addClass('text-info');
    } else if ('ERR' == type) {
        var audio = new Audio(sound_err);
        audio.play();
        $("#nm_icon").removeClass('text-info').addClass('text-error').html('<i class="icon-warning-sign"></i>');
        $("#nm_text").removeClass('text-info').addClass('text-error');
    };
    $("#nm_text").html(msg)
    $("#notify_message").delay(6000).fadeOut(500);
}

function show_ajax_loader_s() {
    // $("#ajax-loader-s").css('display', 'none');
    // $("#ajax-loader-s").fadeIn(10);
    Pace.restart();
}

function hide_ajax_loader_s() {
    // $("#ajax-loader-s").css('display', 'none');
    //$("#ajax-loader-s").hide();
    Pace.stop();
}

function calcSize(size) {
    if (size < 1024) {
        return $.sprintf('%0.2f B', size);
    } else if (size >= 1024 && size < 1048576) { //1024 * 1024
        return $.sprintf('%0.2f KB', size / 1024);
    } else if (size >= 1048576 && size < 1073741824) { //1024^3
        return $.sprintf('%0.2f MB', size / 1048576);
    } else if (size >= 1073741824) {
        return $.sprintf('%0.2f GB', size / 1073741824);
    };
}

function async_post(url, postdata, refresh_timeout, refresh_url) {
    show_ajax_loader_s();
    $.post(url, postdata, function(data) {
        show_notify_msg(data.msg, data.code);
        if (data.code == 'OK' && refresh_timeout && refresh_url) {
            window.setTimeout(function() {
                if (refresh_url == 'reload') { //
                    window.location.reload();
                } else {
                    window.location = refresh_url;
                };

            }, refresh_timeout)
        };
    }).fail(function(err) {
        show_notify_msg(err.status + ' ' + err.statusText, 'ERR');
    }).always(function() {
        hide_ajax_loader_s();
    })
}

function table_add() {
    var lg = $("#table_add tr").length;
    var $trone = $("#table_add").children('tr').eq(0);
    var td = $trone.children('td').eq(0);
    if (lg == 1 && td.html() == '没有匹配结果') {
        show_notify_msg('请添加' + $("#common_name").val() + '!!', 'ERR');
        return false;
    } else {
        for (var i = 0; i < lg; i++) {
            var $tr = $("#table_add").children('tr').eq(i);
            if ($tr.children('td').eq(0).html() == '' || $tr.children('td').eq(0).html() == 'Click to edit') {
                show_notify_msg('第' + (i + 1) + '行语言不能为空', 'ERR');
                return false;
            };
            if ($tr.children('td').eq(1).html() == '' || $tr.children('td').eq(1).html() == 'Click to edit') {
                show_notify_msg('第' + (i + 1) + '行' + $("#common_name").val() + '不能为空', 'ERR');
                return false;
            };
        };
        return true;
    }

}

function add_to_favorite_tcode(tcode_id) {
    if (tcode_id) {
        show_ajax_loader_s();
        var post_url = "/tcode_add_to_favorite";
        var post_data = {
            tcode_id: tcode_id
        };
        $.post(post_url, post_data, function(ret_data) {
            show_notify_msg(ret_data.msg, ret_data.code);
        }).fail(function(err) {
            show_notify_msg(err.status + ' ' + err.statusText, 'ERR');
        }).always(function() {
            hide_ajax_loader_s();
        })
    };
}

function add_to_favorite_urls() {
    var url = window.location.pathname + window.location.search;
    var title = $('head title').text().replace('智思云 | ', '')
    show_ajax_loader_s();
    var post_url = "/admin/user/add_to_favorite_url";
    var post_data = {
        url: url,
        title: title,
    };
    $.post(post_url, post_data, function(ret_data) {
        show_notify_msg(ret_data.msg, ret_data.code);
    }).fail(function(err) {
        show_notify_msg(err.status + ' ' + err.statusText, 'ERR');
    }).always(function() {
        hide_ajax_loader_s();
    })
}

function del_tcode_from_favorite(tcode_id, obj) {
    alert(tcode_id);
    $(obj).parent.delete();
    return false;
}

function userprocess_ti(tiid) {
    var purl = '/admin/wf/process_ti/' + tiid;
    $.get(purl, function(data) {
        show_ajax_loader_s();
        if (data.code == 'OK') {
            show_notify_msg(data.msg, data.code);
            var url = data.data;
            window.location = url;
        };
    }).fail(function(err) {
        show_notify_msg(err.status + ' ' + err.statusText, 'ERR');
    }).always(function() {
        hide_ajax_loader_s();
    })
}

function rndp2(x) { //保留2位小数点
    return Math.round(x * 100) / 100;
}

function rndp3(x) { //保留3位小数点
    return Math.round(x * 1000) / 1000;
}

function go_grade(qt_id) {
    window.location = '/admin/pm/questionnair_template/grade_bbform?qt_id=' + qt_id;
}

function go_common_grade(qt_id,category) {
    window.location = '/admin/pm/questionnair_template/grade_common_bbform?qt_id=' + qt_id + "&category="+category;
}
