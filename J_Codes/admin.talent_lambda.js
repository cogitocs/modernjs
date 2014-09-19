var otblPosition, obtlAi, otbl360, pep_data, append_id = [];
var horoscope_data, parent_datas = [],
    horoscope; //九宫图数据

//能力数据
var qis; //所有问卷实例
var qis_overall;
var tbl_overall;

var emp_names = [],
    emp_ids = [],
    pep_data, type_val, append_id = [];
var setting_p = {
    check: {
        enable: true,
    },
    data: {
        simpleData: {
            enable: true
        }
    },
    view: {
        nameIsHTML: true
    }
};
var treeObj01 = null;
var treeObj02 = null;

//backbone config
var Lambda = Backbone.Model.extend({
    idAttribute: "_id",
    rootUrl: '/user/report/lambda_bb',
    url: function() {
        return this.rootUrl + '/' + this.id;
    },
});

var LambdaAiListView = Backbone.View.extend({
    el: '#ai_list',
    template: Handlebars.compile($("#tmp_ai").html()),
    render: function() {
        var self = this;
        var ais = this.model.get('lambda_ai_period');
        var rendered_data = _.map(ais, function(x) {
            return self.template(x)
        })
        this.$el.html(rendered_data.join(''));
        return this;
    },
})
var Lambda360ListView = Backbone.View.extend({
    el: '#ques_list',
    template: Handlebars.compile($("#tmp_ques").html()),
    render: function() {
        var self = this;
        var ques = this.model.get('lambda_ques_360');
        var rendered_data = _.map(ques, function(x) {
            return self.template(x)
        })
        this.$el.html(rendered_data.join(''));
        return this;
    },
})
var LambdaTalentListView = Backbone.View.extend({
    el: '#talent_list',
    template: Handlebars.compile($("#tmp_talent").html()),
    render: function() {
        var self = this;
        var talent = this.model.get('lambda_data');
        var rendered_data = _.map(talent, function(x) {
            return self.template(x)
        })
        this.$el.html(rendered_data.join(''));
        return this;
    },
})
var lambda = new Lambda();
var ai_view = new LambdaAiListView({
    model: lambda
})
var ques_view = new Lambda360ListView({
    model: lambda
})
var talent_view = new LambdaTalentListView({
    model: lambda
})
Handlebars.registerHelper('toISODate', function(date) {
    return moment(date).format('YYYY-MM-DD');
});
Handlebars.registerHelper('span', function(horoscope) {

    return '<span class="lable label-info">' + horoscope + '</span>';
});
$(document).ready(function() {
    var mode = $.getQuery()['is_save'];
    if (mode == 'true') { //进入只读模式
        $("input,select,button").attr('disabled', true);
        $("#clo").attr('disabled', false);
        $("#go_to_list").attr('disabled', false);

        $("#go_to_list").show();
        $("legend").html("人才盘点－查看")
    };
    $(".chzn-select").chosen({
        disable_search_threshold: 10
    });

    $("#tbl_overall tbody tr").mousedown(function() {
        $("tr.selected").removeClass("selected");
        $(this).addClass("selected");
    });
    otblPosition = $('#tblPosition').dataTable({
        "bRetrieve": true,
        "bDestroy": true,
        "oLanguage": {
            "sUrl": (i18n.lng() == 'zh') ? "/pagejs/dataTables.chinese.json" : ""
        }
    });
    otblAi = $('#tblAi').dataTable({
        "bRetrieve": true,
        "bDestroy": true,
        "oLanguage": {
            "sUrl": (i18n.lng() == 'zh') ? "/pagejs/dataTables.chinese.json" : ""
        }
    });
    otbl360 = $('#tbl360').dataTable({
        "bRetrieve": true,
        "bDestroy": true,
        "oLanguage": {
            "sUrl": (i18n.lng() == 'zh') ? "/pagejs/dataTables.chinese.json" : ""
        }
    });
    $.get('/admin/pm/questionnair_template/get_qis_report_json', function(data) {
        if (data) {
            if (data.code == 'OK') {
                qis = data.qis;

                if (qis) {
                    redraw_tbl_qis_overall(qis);
                }
            };
        };
    }).fail(function(err) {
        show_notify_msg(err.status + ' ' + err.statusText, 'ERR');
    });

    //lambda object
    $.get('/user/report/people_help_json', function(data) {
        $.fn.zTree.init($("#treeDemo02"), setting_p, data);
        treeObj02 = $.fn.zTree.getZTreeObj("treeDemo02");

    })
    $.get('/user/report/position_help_json', function(data) {

        $.fn.zTree.init($("#treeDemo01"), setting_p, data);
        treeObj01 = $.fn.zTree.getZTreeObj("treeDemo01");

    })
    $("#company").on('click', function() {
        $("#cond").show()
        $("input[name='icon_radio']").each(function() {
            if ($(this).attr("checked")) {
                type_val = 1
                $("#type_val").val('1')
                $("#position_tree").show()
                $("#people_tree").hide()
                $("#footer").show()
                $("#condition").show()
                $("#ih_table").hide()
            }
        })
        $("#ihModalLabel").html("盘点对象");
        $("#ihModal").modal();

    })
    $("#s_radio input:[name='icon_radio']").on('change', function() {
        if ($(this).val() == "0") {
            $("#type_val").val('1')
            type_val = 1;
            $("#position_tree").show();
            $("#people_tree").hide();
        } else {
            type_val = 2;
            $("#type_val").val('2')
            $("#people_tree").show();
            $("#position_tree").hide();
        }
    })
    $("#btn_expand_all").on('click', function(event) {
        event.preventDefault();
        type_val = $("#type_val").val();
        if (type_val == '1') {
            var treeObj = $.fn.zTree.getZTreeObj("treeDemo01");
            treeObj.expandAll(true);
        } else if (type_val == '2') {
            var treeObj = $.fn.zTree.getZTreeObj("treeDemo02");
            treeObj.expandAll(true);
        }

    });
    $("#btn_collapse_all").on('click', function(event) {
        event.preventDefault();
        type_val = $("#type_val").val();
        if (type_val == '1') {
            var treeObj = $.fn.zTree.getZTreeObj("treeDemo01");
            treeObj.expandAll(false);
        } else if (type_val == '2') {
            var treeObj = $.fn.zTree.getZTreeObj("treeDemo02");
            treeObj.expandAll(false);
        }

    });
    $("#btn_filter").on('click', function(event) {
        event.preventDefault();
        type_val = $("#type_val").val();
        if (type_val == '1') {
            var treeObj = $.fn.zTree.getZTreeObj("treeDemo01");
            var posnodes = treeObj.getNodesByParam('type', 'p');
            var selected = treeObj.getNodesByParamFuzzy('name', $("#filter_term").val());
            treeObj.hideNodes(posnodes);
            treeObj.showNodes(selected);
        } else if (type_val == '2') {
            var treeObj = $.fn.zTree.getZTreeObj("treeDemo02");
            var posnodes = treeObj.getNodesByParam('type', 'P'); //
            var selected = treeObj.getNodesByParamFuzzy('name', $("#filter_term").val());
            treeObj.hideNodes(posnodes);
            treeObj.showNodes(selected);
        }

    });
    $('.text-toggle-button').toggleButtons({
        width: 100,
        label: {
            enabled: "是",
            disabled: "否"
        }
    });

    //backbone operation
    fetch_lambdas();

    lambda.on('sync', function() {
        ai_view.render();
        ques_view.render();
        talent_view.render()

    })
    $("body")
        .on('click', '#btn_save', function(event) {
            event.preventDefault();
            var is_save = true;
            var lambda_date = moment();
            lambda.set('lambda_date', lambda_date)
            lambda.set('is_save', is_save)
            lambda.save(lambda.attributes, {
                success: function(model, response, options) {
                    show_notify_msg('数据保存成功', 'OK');
                    $("#btn_talent_lambda").attr('disabled', true);
                    $("#btn_save").attr('disabled', true);
                    lambda.trigger('sync')
                    fetch_lambdas();
                },
                error: function(model, xhr, options) {
                    show_notify_msg('数据保存成功失败', 'ERR');
                }
            });

        })
        .on('change', '#lambda_name', function(event) {
            event.preventDefault();
            lambda.set('lambda_name', $(this).val())
            lambda.save(lambda.attributes, {
                success: function(model, response, options) {
                    show_notify_msg('数据已添加', 'OK');
                    lambda.trigger('sync')
                    fetch_lambdas();

                },
                error: function(model, xhr, options) {
                    show_notify_msg('数据添加失败', 'ERR');
                }
            });

        })
        .on('change', '#ai_weight', function(event) {
            event.preventDefault();
            if (parseInt($(this).val()) > 100) {
                alert('请输入小于100的数值!!!')
                $(this).val('')
            } else {
                lambda.set('ai_weight', $(this).val())
                lambda.set('com_weight', 100 - parseInt($(this).val()))
                $("#com_weight").val(100 - parseInt($(this).val()));
                lambda.save(lambda.attributes, {
                    success: function(model, response, options) {
                        show_notify_msg('更改已保存', 'OK');
                        lambda.trigger('sync')
                        fetch_lambdas();


                    },
                    error: function(model, xhr, options) {
                        show_notify_msg('更改失败', 'ERR');
                    }
                });
            }

        })
        .on('change', '#com_weight', function(event) {
            event.preventDefault();
            if (parseInt($(this).val()) <= 100) {
                lambda.set('com_weight', $(this).val())
                lambda.set('ai_weight', 100 - parseInt($(this).val()))

                $("#ai_weight").val(100 - parseInt($(this).val()));
                lambda.save(lambda.attributes, {
                    success: function(model, response, options) {
                        show_notify_msg('更改已保存', 'OK');
                        lambda.trigger('sync')
                        fetch_lambdas();
                        // lambda.trigger('sync')

                    },
                    error: function(model, xhr, options) {
                        show_notify_msg('更改失败', 'ERR');
                    }
                });
            } else {
                alert('请输入小于100的数值!!!')
                $(this).val('')
            }
        })
        .on('click', '#ques_sure', function(event) {
            event.preventDefault();

            var lambda_ques_360 = [];
            otbl360.fnClearTable()
            $("input:[name='checkbox']").each(function() {
                if ($(this).attr("checked")) {
                    if ($(this).val() != "") {
                        var obj = {};
                        obj.period = $(this).val();
                        obj.qt_id = $(this).attr("qt_id");
                        obj.period_name = $(this).attr("period_name");
                        obj.qt_name = $(this).attr("qt_name");
                        obj.begin = $(this).attr("begin")
                        lambda_ques_360.push(obj)
                        otbl360.fnAddData([
                            $(this).attr("qt_name"),
                            $(this).attr("period_name"),
                            $(this).attr("begin"),
                            '<div class="btn-group"><a href="#" class="btn btn-small" onclick="del_item_b(this)"><i class="icon-remove"></i></a></div>'

                        ])
                    }
                }
            })
            lambda.set('lambda_ques_360', lambda_ques_360)
            lambda.save(lambda.attributes, {
                success: function(model, response, options) {
                    show_notify_msg('更改已保存', 'OK');
                    lambda.trigger('sync')
                    fetch_lambdas();
                    // lambda.trigger('sync')

                },
                error: function(model, xhr, options) {
                    show_notify_msg('更改失败', 'ERR');
                }
            });
        })
        .on('click', '#btn_ih_period', function(event) {
            event.preventDefault();
            $.get('/user/report/input_help360', function(data) {
                if (data) {
                    $("#footer").hide()
                    $("#cond").hide()
                    $("#condition").hide()
                    $("#ih_table").show()
                    $("#manobj").html("periods");
                    $("#ihModalLabel").html("盘点周期－列表选择");
                    $("#ih_table").html(data);
                    $("#ihModal").modal();
                    $('#tblPeriod360IH tbody tr').live('click', function(e) {
                        $("#periods").val($(this).children().eq(0).html())
                        $("#ihModal").modal('hide');
                        lambda.set('lambda_period', $(this).children().eq(0).html())
                        lambda.save(lambda.attributes, {
                            success: function(model, response, options) {
                                show_notify_msg('更改已保存', 'OK');
                                lambda.trigger('sync')
                                fetch_lambdas();
                                // lambda.trigger('sync')

                            },
                            error: function(model, xhr, options) {
                                show_notify_msg('更改失败', 'ERR');
                            }
                        });

                    })
                };
            })

        })
        .on('click', '#ques_sure1', function(event) {
            event.preventDefault();
            var lambda_ai_period = []
            otblAi.fnClearTable();

            $("input:[id='period']").each(function() {
                if ($(this).attr("checked")) {
                    if ($(this).val() != "") {
                        var obj = {};
                        obj.period = $(this).val();
                        obj.period_name = $(this).attr("name");
                        obj.from = $(this).attr("from");
                        obj.to = $(this).attr("to")
                        lambda_ai_period.push(obj);
                        var item = [];
                        item.push($(this).attr("name"))
                        item.push($(this).attr("from"))
                        item.push($(this).attr("to"))
                        item.push('<div class="btn-group"><a href="#" class="btn btn-small" onclick="del_item(this)"><i class="icon-remove"></i></a></div>')
                        otblAi.fnAddData(item)
                    }
                }
            })
            // otblAi.fnAddData(item)
            lambda.set('lambda_ai_period', lambda_ai_period)
            lambda.save(lambda.attributes, {
                success: function(model, response, options) {
                    show_notify_msg('更改已保存', 'OK');
                    lambda.trigger('sync')
                    fetch_lambdas();
                    // lambda.trigger('sync')

                },
                error: function(model, xhr, options) {
                    show_notify_msg('更改失败', 'ERR');
                }
            });
        })
        .on('click', '#make_sure', function(event) {
            event.preventDefault();
            //关键岗位&部门管理者
            var key_position = false;
            var manager = false
            if ($("#key_position").attr("checked")) {
                key_position = true
            }
            if ($("#manager").attr("checked")) {
                manager = true
            }
            if (type_val == '1') {
                var treeObj = $.fn.zTree.getZTreeObj("treeDemo01");

                var nodes = treeObj.getCheckedNodes(true);
                // console.log(nodes);
                emp_names.length = 0;
                emp_ids.length = 0;
                for (var i = 0, l = nodes.length; i < l; i++) {
                    if (key_position && !manager) {
                        if (nodes[i].type == 'p' && nodes[i].is_key == key_position) {
                            emp_names.push(nodes[i].name);
                            emp_ids.push(String(nodes[i].id))
                        };
                    } else if (manager && !key_position) {
                        if (nodes[i].type == 'p' && nodes[i].position_manager == manager) {
                            emp_names.push(nodes[i].name);
                            emp_ids.push(String(nodes[i].id))
                        };
                    } else if (key_position && manager) {
                        if (nodes[i].type == 'p' && nodes[i].position_manager == manager && nodes[i].is_key == key_position) {
                            emp_names.push(nodes[i].name);
                            emp_ids.push(String(nodes[i].id))
                        };
                    } else {
                        if (nodes[i].type == 'p') {
                            emp_names.push(nodes[i].name);
                            emp_ids.push(String(nodes[i].id))
                        };
                    }

                }

                lambda.set('lambda_object', emp_ids)
            } else if (type_val == '2') {
                var treeObj = $.fn.zTree.getZTreeObj("treeDemo02");
                var nodes = treeObj.getCheckedNodes(true);
                emp_names.length = 0;
                emp_ids.length = 0;
                for (var i = 0, l = nodes.length; i < l; i++) {
                    if (key_position && !manager) {
                        if (nodes[i].type == 'P' && nodes[i].is_key == key_position) {
                            emp_names.push(nodes[i].name);
                            emp_ids.push(String(nodes[i].id))
                        };
                    } else if (manager && !key_position) {
                        if (nodes[i].type == 'P' && nodes[i].position_manager == manager) {
                            emp_names.push(nodes[i].name);
                            emp_ids.push(String(nodes[i].id))
                        };
                    } else if (key_position && manager) {
                        if (nodes[i].type == 'P' && nodes[i].position_manager == manager && nodes[i].is_key == key_position) {
                            emp_names.push(nodes[i].name);
                            emp_ids.push(String(nodes[i].id))
                        };
                    } else {
                        if (nodes[i].type == 'P') {
                            emp_names.push(nodes[i].name);
                            emp_ids.push(String(nodes[i].id))
                        };
                    }
                }
                lambda.set('lambda_object', emp_ids)
            }

            lambda.save(lambda.attributes, {
                success: function(model, response, options) {
                    show_notify_msg('更改已保存', 'OK');
                    lambda.trigger('sync')
                    fetch_lambdas();
                    // lambda.trigger('sync')

                },
                error: function(model, xhr, options) {
                    show_notify_msg('更改失败', 'ERR');
                }
            });
        })
        .on('click', '#checkedAll', function(event) {
            // event.preventDefault();
            if ($("#checkedAll").attr("checked")) {
                $("input:[name='checkboxes']").each(function() {
                    $(this).attr("checked", true)
                })

            } else {
                $("input:[name='checkboxes']").each(function() {
                    $(this).attr("checked", false)
                })
            }

        })
        .on('click', '.btn_live', function(event) {
            event.preventDefault();

            var lambda_data = lambda.get('lambda_data');

            var horoscopes = horoscope[0];
            parent_datas.length = 0;
            var temp_data = [];
            temp_data.push($(this).data("up_id"))
            var filter_data = _.filter(lambda_data, function(temp) {
                return !!~temp_data.indexOf(String(temp._id))
            })
            _.each(filter_data, function(q) {
                if (q) {
                    var obj = {};
                    obj.data = [];
                    obj.name = q.people_name + ' (' + q.position_name + ')';
                    obj.id = q.people + '-' + q.position;
                    var pos = [];
                    pos.push(changeTwoDecimal(q.ai_score));
                    pos.push(changeTwoDecimal(q.score));
                    obj.data.push(pos);
                    parent_datas.push(obj)
                };
            })

            $("#ihModalhoroscope").modal();
            $("#ihModalLabelHoroscope").html('人才-九宫图');
            basic_line($('#chart01'), parent_datas, horoscopes);

        })

    $("#tblAi").on('click', '.btn_remove', function(event) {
        var $this = $(this);
        var ai_period_id = $this.data("up_id");
        var lambda_ai_period = lambda.attributes.lambda_ai_period;
        var found = delete_data(ai_period_id, lambda_ai_period);
        lambda.attributes.lambda_ai_period = found;
        lambda.save(lambda.attributes, {
            success: function(model, response, options) {
                show_notify_msg('更改已保存', 'OK');
                // return value;
                lambda.trigger('sync')
                fetch_lambdas()
            },
            error: function(model, xhr, options) {
                show_notify_msg('更改失败', 'ERR');
            }
        });

    })
    $("#tbl360").on('click', '.btn_remove', function(event) {
        var $this = $(this);
        var ques_id = $this.data("up_id");
        var lambda_ques_360 = lambda.attributes.lambda_ques_360;
        var found = delete_data(ques_id, lambda_ques_360);
        lambda.attributes.lambda_ques_360 = found;
        lambda.save(lambda.attributes, {
            success: function(model, response, options) {
                show_notify_msg('更改已保存', 'OK');
                // return value;
                lambda.trigger('sync')
                fetch_lambdas()
            },
            error: function(model, xhr, options) {
                show_notify_msg('更改失败', 'ERR');
            }
        });

    })

    //绩效周期
    $("#btn_ai_period").on('click', function(e) {
        $.get('/admin/pm/period_management/input_help_ai/' + $("#company_id").val(), function(data) {
            if (data) {
                // $("#manobj").html(this.id.substr('btn_ih_'.length));
                $("#ihModalLabel1").html("考核周期－列表选择");
                $("#ih_table1").html(data);
                $("#ihModal1").modal();
                $(".group-checkable1").uniform();
                $(".checkboxes1").uniform();
                jQuery('.group-checkable1').change(function() {
                    var set = jQuery(this).attr("data-set");
                    var checked = jQuery(this).is(":checked");
                    jQuery(set).each(function() {
                        if (checked) {
                            $(this).attr("checked", true);
                        } else {
                            $(this).attr("checked", false);
                        }
                    });
                    jQuery.uniform.update(set);
                });
            };
        })
    })

    $("#btn_360_period").on('click', function(e) {
        $.get('/user/report/input_help_360', function(data) {
            if (data) {
                type_val = 3
                $("#type_val").val('3')
                // $("#manobj").html(this.id.substr('btn_ih_'.length));
                $("#ihModalLabel2").html("考核周期－列表选择");
                $("#ih_table2").html(data);
                $("#ihModal2").modal();
                $(".group-checkable1").uniform();
                $(".checkboxes1").uniform();
                jQuery('.group-checkable1').change(function() {
                    var set = jQuery(this).attr("data-set");
                    var checked = jQuery(this).is(":checked");
                    jQuery(set).each(function() {
                        if (checked) {
                            $(this).attr("checked", true);
                        } else {
                            $(this).attr("checked", false);
                        }
                    });
                    jQuery.uniform.update(set);
                });
            };
        })
    })
    //人才盘点
    $("#btn_talent_lambda").on('click', function(event) {
        var obj = {};
        obj.lambda_id = $("#up_id").val()
        $.post('/user/report/talent_lambda_json', obj, function(data) {
            horoscope_data = data.result;
            if (data.code == 'OK') {
                alert("人才盘点完成！！！")
            } else {
                alert("人才盘点失败！！！")
            }
            lambda.trigger('sync')
            fetch_lambdas()

        })
    })
    $("#go_to_list").on('click', function() {
        window.location.href = "/user/report/lambda_list"
    })
    //九宫图
    $("#btn_talent_horoscope").on('click', function(event) {
        var lambda_data = lambda.get('lambda_data');

        var horoscopes = horoscope[0];
        parent_datas.length = 0;
        var temp_data = [];
        $("input[name='checkboxes']").each(function() {
            if ($(this).attr("checked")) {
                if ($(this).data("up_id") != "") {
                    temp_data.push(String($(this).data("up_id")))
                }
            }
        })
        var filter_data = _.filter(lambda_data, function(temp) {
            return !!~temp_data.indexOf(String(temp._id))
        })
        _.each(filter_data, function(q) {
            if (q) {
                var obj = {};
                obj.data = [];
                obj.name = q.people_name + ' (' + q.position_name + ')';
                obj.id = q.people + '-' + q.position;
                var pos = [];
                pos.push(changeTwoDecimal(q.ai_score));
                pos.push(changeTwoDecimal(q.score));
                obj.data.push(pos);
                parent_datas.push(obj)
            };
        })

        $("#ihModalhoroscope").modal();
        $("#ihModalLabelHoroscope").html('人才-九宫图');
        basic_line($('#chart01'), parent_datas, horoscopes);
    })
    //人才对比
    $.get('/user/report/input_help_lambda', function(data) {
        if (data) {
            pep_data = data.data.peps;
            horoscope = data.data.horoscope;
        };
    })
    $("#btn_talent_com").on('click', function() {
        $("#div_a").hide();
        $("#div_b").hide();
        $("#div_c").hide();
        $("legend").html("人才对比")
        $("#div_d").show()
        var temp_data = [];
        $("input[name='checkboxes']").each(function() {
            if ($(this).attr("checked")) {
                if ($(this).data("field") != "") {
                    temp_data.push(String($(this).data("field")))
                }
            }
        })
        temp_data = _.filter(temp_data, function(temp) {
            return !~append_id.indexOf(temp)
        })
        var p_data = _.filter(pep_data, function(temp) {
            return !!~temp_data.indexOf(String(temp._id))
        })
        draw_talent(p_data)
    })
    $("#droppable").droppable({
        drop: function(event, ui) {}
    });
    $("#droppable").sortable({
        option: 'placeholder',
        // axis: 'x',
        start: function(event, ui) {
            $("#droppable").droppable('disable')
        },
        stop: function(event, ui) {
            $("#droppable").droppable('enable')
        }
    })

    $("#droppable").disableSelection();
});

function fetch_lambdas() {
    lambda.url = "/user/report/lambda_bb/" + $("#up_id").val();
    lambda.fetch();
}

function redraw_tbl_qis_overall(qis) {
    var tblData = [];
    var qtcs = _.groupBy(qis, function(q) {
        return q.qtc._id;
    });
    var qtcs_ids = _.keys(qtcs);

    _.each(qtcs_ids, function(qi) {
        var objs_all = qtcs[qi];
        var objs = _.filter(objs_all, function(qi) {
            return qi.status != '0';
        });
        if (objs.length > 0) {
            var max = _.max(objs, function(obj) {
                return obj.score;
            });
            var min = _.min(objs, function(obj) {
                return obj.score;
            });
            var sum = 0;
            _.each(objs, function(q) {
                sum += q.score;
            });
            var avg = sum / objs.length;

            var cdate = _.max(objs, function(obj) {
                return moment(obj.createDate).month();
            });

            var q = objs[0];

            var row = [];
            // row.push($.sprintf('<input type="checkbox" class="checkboxes1" value="%s" qt_id="%s" period_name="%s" qt_name ="%s" begin="%s"></input>', q.period._id, q._id, q.period.period, q.qt_name, moment(cdate.createDate).format("YYYY-MM-DD")));
            row.push('<input name="checkbox" type="checkbox" class="checkboxes1" value="' + q.period._id + '" qt_id="' + q._id + '" period_name="' + q.period.period + '" qt_name ="' + q.qt_name + '" begin="' + moment(cdate.createDate).format("YYYY-MM-DD") + '"></input>');

            row.push(q.qt_name);
            row.push(q.period.period);
            row.push(moment(cdate.createDate).format("YYYY-MM-DD"));
            row.push(objs.length + '/' + objs_all.length);
            row.push(parseFloat(max.score).toFixed(2));
            row.push(parseFloat(min.score).toFixed(2));
            row.push(parseFloat(avg).toFixed(2));
            tblData.push(row);
        }
    });
    tbl_overall = $('#tbl_overall').dataTable({
        "sDom": "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
        "aaData": tblData,
        "bPaginate": true,
        "bSort": false,
        "bRetrieve": true,
        "oLanguage": {
            "sUrl": (i18n.lng() == 'zh') ? "/pagejs/dataTables.chinese.json" : ""
        },
        "fnInitComplete": function(oSettings, json) {
            $(".chzn-select, .dataTables_length select").chosen({
                disable_search_threshold: 10
            });
        }
    });
}

function del_item(obj) {
    otblAi.fnDeleteRow(obj.parentNode.parentNode.parentNode);
}

function del_item_b(obj) {
    otbl360.fnDeleteRow(obj.parentNode.parentNode.parentNode);
}

function delete_data(id, data) {
    var found = _.filter(data, function(x) {
        return x._id != String(id)
    })
    return found;
}

function changeTwoDecimal(x) {
    var f_x = parseFloat(x);
    if (isNaN(f_x)) {
        return false;
    }
    var f_x = Math.round(x * 100) / 100;

    return f_x;
}
//人才九宫图
var basic_line = function(content, series_data, horoscope) {
    content.highcharts({
        chart: {
            type: 'scatter',
            zoomType: 'xy'
        },
        title: {
            text: '人才分布九宫图',
            enabled: true,
        },
        exporting: {
            enabled: false
        },
        subtitle: {
            enabled: false
        },
        xAxis: {
            title: {
                text: horoscope.x_title
            },
            min: 0,
            max: horoscope.xis_max,
        },
        legend: {
            enabled: false
        },
        credits: {
            enabled: true,
            style: {
                cursor: 'default',
                color: '#909090',
                fontSize: '11px'
            },
            href: '',
            text: 'www.zhisiyun.com'
        },
        yAxis: {
            min: 0,
            max: horoscope.yis_max,
            gridLineWidth: 0,
            title: {
                text: horoscope.y_title
            },
        },

        tooltip: {
            headerFormat: '<span style="color:{series.color};font-size:10px">{series.name}</span><table>',
            pointFormat: '<tr><td  style="padding:0"><b>绩效得分: {point.x}</b> </td></tr><tr><td style="padding:0"><b>能力得分: {point.y} </b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        series: series_data ? series_data : [{
            data: []
        }]
    }, function(chart) {
        var X1 = horoscope.x_a;
        var X2 = horoscope.x_b;
        var x = horoscope.xis_max;
        var y = horoscope.yis_max;
        var Y2 = horoscope.y_b;
        var Y1 = horoscope.y_a;
        var color_title = horoscope.color;
        var x0 = chart.xAxis[0].toPixels(0, false);
        var x1 = chart.xAxis[0].toPixels(X1, false);
        var x2 = chart.xAxis[0].toPixels(X2, false);
        var x3 = chart.xAxis[0].toPixels(x, false);

        var y0 = chart.yAxis[0].toPixels(y, false);
        var y1 = chart.yAxis[0].toPixels(Y2, false);
        var y2 = chart.yAxis[0].toPixels(Y1, false);
        var y3 = chart.yAxis[0].toPixels(0, false);
        var title_color1 = filter_color('1', color_title);
        var title_color2 = filter_color('2', color_title);
        var title_color3 = filter_color('3', color_title);

        var title_color4 = filter_color('4', color_title);
        var title_color5 = filter_color('5', color_title);
        var title_color6 = filter_color('6', color_title);

        var title_color7 = filter_color('7', color_title);
        var title_color8 = filter_color('8', color_title);
        var title_color9 = filter_color('9', color_title);
        var color_d1 = chart.renderer.rect(x0, y2, x1 - x0, y3 - y2, 1).attr({
            fill: title_color1.color_type,
            id: 'color_d1_title',
            title: title_color1.color_des_category + ':' + title_color1.color_description,
            zIndex: 0
        }).add();
        chart.renderer.rect(x0, y1, x1 - x0, y2 - y1, 1).attr({
            fill: title_color2.color_type,
            id: 'color_d2',
            title: title_color2.color_des_category + ':' + title_color2.color_description,
            zIndex: 0
        }).add();
        chart.renderer.rect(x0, y0, x1 - x0, y1 - y0, 1).attr({
            fill: title_color3.color_type,
            id: 'color_d3',
            title: title_color3.color_des_category + ':' + title_color3.color_description,
            zIndex: 0
        }).add();
        chart.renderer.rect(x1, y2, x2 - x1, y3 - y2, 1).attr({
            fill: title_color4.color_type,
            title: title_color4.color_des_category + ':' + title_color4.color_description,
            id: 'color_d4',
            zIndex: 0
        }).add();
        chart.renderer.rect(x1, y1, x2 - x1, y2 - y1, 1).attr({
            fill: title_color5.color_type,
            id: 'color_d5',
            title: title_color5.color_des_category + ':' + title_color5.color_description,
            zIndex: 0
        }).add();
        chart.renderer.rect(x1, y0, x2 - x1, y1 - y0, 1).attr({
            fill: title_color6.color_type,
            id: 'color_d6',
            title: title_color6.color_des_category + ':' + title_color6.color_description,
            zIndex: 0
        }).add();
        chart.renderer.rect(x2, y2, x3 - x2, y3 - y2, 1).attr({
            fill: title_color7.color_type,
            id: 'color_d7',
            title: title_color7.color_des_category + ':' + title_color7.color_description,
            zIndex: 0
        }).add();
        chart.renderer.rect(x2, y1, x3 - x2, y2 - y1, 1).attr({
            fill: title_color8.color_type,
            id: 'color_d8',
            title: title_color8.color_des_category + ':' + title_color8.color_description,
            zIndex: 0
        }).add();
        chart.renderer.rect(x2, y0, x3 - x2, y1 - y0, 1).attr({
            fill: title_color9.color_type,
            id: 'color_d9',
            title: title_color9.color_des_category + ':' + title_color9.color_description,
            zIndex: 0
        }).add();
    });
}

    function filter_color(type_val, horo) {
        var found = _.find(horo, function(temp) {
            return temp.block_name == type_val
        })
        return found;
    }

    function draw_talent(p_data) {
        var item = [];
        var index_arr = [];
        _.each(p_data, function(p) {
            index_arr.push(String(p._id))
        })
        _.each(p_data, function(p) {
            append_id.push(p._id)
            var index = index_arr.indexOf(String(p._id))
            var result = parseInt(index) % 3;
            if (result == 0) {
                if (index != 0) {
                    item.push("</div>")
                }
                item.push('<div class="row-fluid">')
            }
            var education = p.educationalbackground_name ? p.educationalbackground_name : '';
            item.push("<div  id='" + p._id + "' class='span4 pricing hover-effect'>")
            item.push("<div  class='pricing-head'>")
            item.push('<button style="margin-top: 5px;margin-left: 10px;" class="close" type="button" onclick="del_pep(%'' + p._id + '%')" title="删除"></button>')
            item.push("<h3 class='Begginer'>" + p.firstname + p.lastname + "</h3>")
            item.push("<div  class='dlg_icon'>");
            item.push("<img class='org-avatar-s img-rounded img-polaroid pull-left' style='max-width:100px; max-height:100px;' src='/gridfs/get/" + p.avatar + "'></img>")
            item.push("</div>")
            item.push("</div>")
            item.push("<ul class='pricing-content unstyled'>")
            item.push("<li><i class='icon-home'></i>公司: " + p.company_name + "</li>")
            item.push("<li><i class='icon-sitemap'></i>部门: " + p.ou_name + "</li>")
            item.push("<li><i class='icon-th'></i>职位: " + p.position_name + "</li>")
            item.push("<li><i class='icon-user'></i>工龄: " + p.years_of_service || '' + "</li>")
            item.push("<li><i class='icon-star'></i>司龄: " + p.years_of_service_client || '' + "</li>")
            item.push("<li><i class='icon-rocket'></i>学历: " + education + "</li>")
            item.push("<li><i class='icon-money'></i>薪酬等级: " + p.position.payroll_grade_low + "~" + p.position.payroll_grade_high + "</li>")
            item.push('<li><button type="button" onclick="add_up(%'' + p._id + '%')" class="btn btn-info">加入晋升清单</button><button onclick="add_learn(%'' + p._id + '%')" type="button" class="btn btn-info">加入培养计划</button></li>')
            item.push("</ul>")
            item.push("</div>")
        })
        $("#droppable").append(item.join(''))

    }

    function del_pep(id) {
        $("#" + id).remove()
        append_id = _.filter(append_id, function(temp) {
            return temp != String(id)
        })
    }
