var pep_data, type_val, append_id = [],
    people_lambda_obj = {},
    lambda_obj = {},
    p_user_obj = {},
    lambdaID,
    payroll,
    payitem,
    lambda_data,
    ai_data, ques_360, talent_type, talent_pool;
var otblTalentPool, tabpages = [],
    tabpage, talent_type, payroll_item, position, par, append_id = [],
    pa_move, pa_event, process_instance, pa_promotion, pa_demotion, py_adjust;
Handlebars.registerHelper('transvert', function(field, people) {
    return people[field]
});
Handlebars.registerHelper('lambda_name', function(data) {
    return data.lambda_name
});

Handlebars.registerHelper('transverts', function(field, people, change_data) {
    if (change_data) {
        return people[field] + '<span class="label label-info">变更</span>'

    } else {
        return people[field]

    }
});

Handlebars.registerHelper('span', function(data) {
    return '<a target="_blank" href="/user/report/lambda?is_save=true&up_id=' + data._id + '"><span class="label label-info">' + data.lambda_name + '</span></a>'
});
Handlebars.registerHelper('data_source', function(data) {
    var item = [];
    item.push('<table class="table table-striped table-bordered" ><tbody>');
    item.push('<tr>')
    item.push('<th>人才盘点</th>')
    item.push('<th>人才盘点周期</th>')
    item.push('<th>盘点日期</th>')
    item.push('</tr>')
    item.push('<tr>')
    item.push('<td><a target="_blank" href="/user/report/lambda?is_save=true&up_id=' + data._id + '"><span class="label label-info">' + data.lambda_name + '</span></a></td>')
    item.push('<td>' + data.lambda_period + '</td>')
    item.push('<td>' + moment(data.validFrom).format('YYYY-MM-DD') + '</td>')
    item.push('</tr>')
    item.push('</tbody></table>');

    return item.join('')
});
Handlebars.registerHelper('period', function(field, lambda) {
    if (field == 'validFrom') {
        return moment(lambda[field]).format('YYYY-MM-DD')
    } else {
        return lambda[field]
    }
});
var LambdaPool = Backbone.Model.extend({
    idAttribute: "_id",
    rootUrl: '/user/report/pool_bb',
    url: function() {
        return this.rootUrl + '/' + this.id;
    },
});

var LambdaPoolListView = Backbone.View.extend({
    el: '#talent_pool',
    template: Handlebars.compile($("#tmp_pool").html()),
    render: function() {
        var self = this;
        var people = this.model.attributes;
        // console.log(people);
        //一个人不能同时在两个池子里
        var filter_data = _.filter(people, function(temp) {
            return !temp.history
        })
        filter_data = _.sortBy(filter_data, function(temp) {
            return moment(temp.talent_lambda.validFrom).format('yyyymmdd')
        })
        var lambda_group = _.groupBy(filter_data, function(temp) {
            return temp.people._id
        })
        var lambda = _.values(lambda_group)
        var item = [];
        _.each(lambda, function(temp) {
            item.push(temp.pop())
        })
        item = _.filter(item, function(temp) {
            return temp.type_name == String(tabpage)
        })
        // var filter_data = _.filter(people, function(temp) {
        //     return temp.type_name == String(tabpage)
        // })


        var rendered_data = _.map(item, function(x) {
            x.talent_type = talent_type
            return self.template(x)
        })
        this.$el.html(rendered_data.join(''));
        return this;
    },
})
var lambda = new LambdaPool();
var pool_view = new LambdaPoolListView({
    model: lambda
})
$(document).ready(function() {
    fetch_lambdas();
    lambda.on('sync', function() {
        if ($.fn.DataTable.fnIsDataTable(document.getElementById('tblTalentPool'))) {
            $('#tblTalentPool').dataTable().fnClearTable();
            $('#tblTalentPool').dataTable().fnDestroy();
        };
        pool_view.render();
        init_datatable();
    })
    init_datatable()
    tabpage = $.getQuery()['tabpage'];
    // $("#"+tabpage).tab('show')
    // $('ul#myTab a[href="#' + tabpage + '"]').tab('show');
    $('ul#myTab a').live('click', function(e) {
        e.preventDefault();
        var $this = $(this);
        $(this).tab('show');
        $("#op_status").val($this.data('op_status'));
        tabpage = $this.data('op_status')
        fetch_lambdas();
    })

    $.get('/admin/pm/talent_type/type_input_help', function(data) {
        talent_type = data.msg.talent_type;
        payroll_item = data.msg.payroll_item;
        position = data.msg.position;
        par = data.msg.par;
        pa_move = data.msg.pa_move;
        pa_event = data.msg.pa_event;
        process_instance = data.msg.process_instance;
        pa_promotion = data.msg.pa_promotion;
        pa_demotion = data.msg.pa_demotion;
        py_adjust = data.msg.py_adjust;
        var data = data.msg.talent_type;

        draw_tab(data)

    })
    $(".group-checkable1").uniform();
    $(".checkboxes1").uniform();
    $("#tblTalentPool tbody")
        .on('click', '.btn_toggle_detail', function(event) { //只响应正常的行

            // .on('click', 'tr.odd, tr.even', function(event) { //只响应正常的行
            event.preventDefault();
            // console.log('tr->', event.target);
            // var nTr = $(this)[0];
            var nTr = $(this).parent().parent().parent()[0];
            var oTable = $("#tblTalentPool").dataTable();
            if (oTable.fnIsOpen(nTr)) {
                oTable.fnClose(nTr);
            } else {
                oTable.fnOpen(nTr, fnFormatDetails(oTable, nTr), 'details');
            }
        })
        .on('click', '.btn_leave', function(event) {
            event.preventDefault();
            // event.stopPropagation();
            var $this = $(this);
            var up_id = $this.data('up_id');
            var lambda_data = _.find(lambda.attributes, function(data) {
                return String(up_id) == data._id
            });
            var id = lambda_data.people._id;
            var name = lambda_data.people.people_name;
            var talent_id = lambda_data.talent_lambda._id;
            window.location.href = '/admin/pa/wf/demotion/start?people=' + id + '&people_name=' + name + '&lambda_id=' + talent_id + '&pool_id=' + up_id
        })
        .on('click', '.btn_up', function(event) {
            event.preventDefault();
            var $this = $(this);
            var up_id = $this.data('up_id');
            var lambda_data = _.find(lambda.attributes, function(data) {
                return String(up_id) == data._id
            });
            var id = lambda_data.people._id;
            var name = lambda_data.people.people_name;
            var talent_id = lambda_data.talent_lambda._id;
            window.location.href = '/admin/pa/wf/promotion/start?people=' + id + '&people_name=' + name + '&lambda_id=' + talent_id + '&pool_id=' + up_id
        })
        .on('click', '.btn_move', function(event) {
            event.preventDefault();
            var $this = $(this);
            var up_id = $this.data('up_id');
            var lambda_data = _.find(lambda.attributes, function(data) {
                return String(up_id) == data._id
            });
            var id = lambda_data.people._id;
            var name = lambda_data.people.people_name;
            var talent_id = lambda_data.talent_lambda._id;
            window.location.href = '/admin/pa/wf/move/start?people=' + id + '&people_name=' + name + '&lambda_id=' + talent_id + '&pool_id=' + up_id
        })
        .on('click', '.btn_adjust_payroll', function(event) {
            event.preventDefault();
            var $this = $(this);
            var up_id = $this.data('up_id');
            var lambda_data = _.find(lambda.attributes, function(data) {
                return String(up_id) == data._id
            });
            var id = lambda_data.people._id;
            var name = lambda_data.people.people_name;
            var talent_id = lambda_data.talent_lambda._id;
            window.location.href = '/admin/py/payroll_adjustment/start?people=' + id + '&people_name=' + name + '&lambda_id=' + talent_id + '&pool_id=' + up_id
        })
        .on('click', '.btn_talent', function(event) {
            event.preventDefault();
            // event.stopPropagation();
            // var $this = $(this);
            // var c_id = $this.data('c_id');
            window.location.href = '/user/report/lambda_list';
        })
        .on('click', '.checkboxes', function(event) {
            // event.preventDefault();
            // event.stopPropagation();
            // var $this = $(this);
            // var c_id = $this.data('c_id');
            // window.location.href = '/user/report/talent';
        })
        .on('click', '.btn_add_qtc', function(event) {
            event.preventDefault();
            var $this = $(this);
            var people = $this.data('people');
            var type_id = $this.data('up_id');
            var talent_id = $this.data('talent');

            change_pool(people, type_id, talent_id)
        })

    $("body").on('click', '#checkedAll', function(event) {
        // event.preventDefault();
        event.stopPropagation();
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
    $.get('/user/report/input_help_lambda', function(data) {
        if (data) {
            lambda_data = data.data.lambda;
            pep_data = data.data.peps;
            payroll = data.data.payroll;
            payitem = data.data.pay_item;
            ai_data = data.data.ai_data;
            ques_360 = data.data.ques_360;
            talent_type = data.data.lambda_type;
            talent_pool = data.data.talent_pool;
            append_id.length = 0
        };
    })
    $("#btn_talent").on('click', function() {
        $("#div_a").hide();
        $("legend").html("人才对比")
        $("#div_d").show()
        var temp_data = [],
            people_lambda_obj = {};
        $("input[name='checkboxes']").each(function() {
            if ($(this).attr("checked")) {
                if ($(this).data("people") != "") {
                    temp_data.push(String($(this).data("people")))
                    var up_id = $(this).data("up_id")
                    var lambda_temp = _.find(lambda.attributes, function(temp) {
                        return String(temp._id) == String(up_id)
                    })
                    people_lambda_obj[String($(this).data("people"))] = lambda_temp.talent_lambda._id;
                    // temp_lambda.push(String($(this).data("up_id")))
                }
            }
        })
        temp_data = _.filter(temp_data, function(temp) {
            return !~append_id.indexOf(temp)
        })
        var p_data = _.filter(pep_data, function(temp) {
            return !!~temp_data.indexOf(String(temp._id))
        })
        draw_talent(p_data, people_lambda_obj)
    })
    $("#btn_msg").on('click', function() {
        event.preventDefault();
        obj.change_reason = $("#change_pool_reason").val();
        $.get('/user/report/talent_pool_json', obj, function(data) {
            if (data) {
                show_notify_msg(data.msg, data.code);
                // draw_talent(p_data, talent_id)
            }
        })
    })
    $("#btn_send_msg").on('click', function() {
        // event.preventDefault();
        var temp_data = [],
            people_name = [];
        // people_lambda_obj = null;
        $("input[name='checkboxes']").each(function() {
            if ($(this).attr("checked")) {
                if ($(this).data("people") != "") {
                    var p_id = String($(this).data("people"))
                    var p_user = String($(this).data("user"))
                    temp_data.push(String($(this).data("user")))
                    people_name.push(String($(this).data("people_name")))
                    var up_id = $(this).data("up_id")
                    var lambda_temp = _.find(lambda.attributes, function(temp) {
                        return String(temp._id) == String(up_id)
                    })
                    var p_data = _.find(pep_data, function(temp) {
                        return String(temp._id) == p_id
                    })
                    var lambda_id = lambda_temp.talent_lambda._id;
                    lambda_obj[p_user] = lambda_id;
                    p_user_obj[p_user] = p_id;
                    var people_detail = draw_talent_single_people(p_data, lambda_id)

                    people_lambda_obj[p_user] = people_detail;
                }
            }
        })

        var temp_people = _.map(people_name, function(temp) {
            return temp
        })
        $("#people_id").val(temp_data);
        $("#msg_theme").val("绩效警告")
        $("#people_name").text(temp_people)
        $("#ihModalLabelMsg").show();
        $("#ihModalLabelMsg").html('消息-发送')
        $("#ihModalMsg").modal();
        // $("#people_name").val(temp_people)

        //发送邮件
        $("#btn_msg_sure").on("click", function() {
            var detail_data;
            if ($("#detail_data").attr("checked")) {
                detail_data = people_lambda_obj
            } else {
                detail_data = null
            }
            if (confirm("确认要对上述人员发送通知吗吗？")) {
                $.post('/user/report/remind', {
                    people_id: temp_data,
                    detail_data: detail_data,
                    lambda_obj: lambda_obj,
                    msg_theme: $("#msg_theme").val(),
                    msg_body: $("#message").val(),
                    p_user_obj: p_user_obj
                }, function(data) {
                    show_notify_msg(data.msg, data.code);
                }).fail(function(err) {
                    show_notify_msg(err.status + ' ' + err.statusText, 'ERR');
                })
            }
        })

    })

});

function fetch_lambdas() {
    lambda.url = "/user/report/pool_bb";
    lambda.fetch();
}

function draw_tab(data) {
    var item = [];
    tabpages.length = 0
    _.each(data, function(temp) {
        tabpages.push(temp.type_name)
        item.push('<li  id ="' + temp.type_name + '" ><a href="#' + temp.type_name + '" data-op_status="' + temp.type_name + '"><span class="label label-info">' + temp.type_name + '</span></a></li>')
    })
    $("#myTab").append(item.join(''))
}
var init_datatable = function() {
    var dontSort = [];
    $('#tblTalentPool thead th').each(function() {
        if ($(this).hasClass('no_sort')) {
            dontSort.push({
                "bSortable": false
            });
        } else {
            dontSort.push(null);
        }
    });
    otblTalentPool = $('#tblTalentPool').dataTable({
        //"sDom": "<'row-fluid table_top_bar'<'span12'<'to_hide_phone' f>>>t<'row-fluid control-group full top' <'span4 to_hide_tablet'l><'span8 pagination'p>>",
        "aaSorting": [
            [0, "asc"],
        ],
        "bPaginate": true,

        "sPagicostcenterType": "full_numbers",
        "bAutoWidth": false,
        "bJQueryUI": false,
        "aoColumns": dontSort,
        "aoColumnDefs": [{
            "bVisible": false,
            "aTargets": [0, 1]
        }],
        "oLanguage": {
            "sUrl": (i18n.lng() == 'zh') ? "/pagejs/dataTables.chinese.json" : ""
        },
        // "bDestroy": destory,
        "fnInitComplete": function(oSettings, json) {
            $(".chzn-select, .dataTables_length select").chosen({
                disable_search_threshold: 10
            });
        }
    });

    $.extend($.fn.dataTableExt.oStdClasses, {
        "s`": "dataTables_wrapper form-inline"
    });
}
var fnFormatDetails = function(oTable, nTr) {
    var aData = oTable.fnGetData(nTr);
    var type_history = _.filter(lambda.attributes, function(x) {
        return x.people._id == aData[0] && x.talent_lambda.lambda_name == aData[1]
    })
    var type_data = _.sortBy(type_history, function(temp) {
        return moment(temp.changeDate).format('yyyymmdd')
    })
    type_data.reverse()
    //---人才历史记录---//
    // //人才池变更记录
    var sOut = '<table class="table table-striped table-bordered" cellpadding="5" cellspacing="0" >';
    sOut += '<tbody>';
    var type_data_temp = _.filter(type_data, function(temp) {
        return temp.change_data
    })
    if (type_data_temp.length > 0) {

        sOut += '<tr><strong>人才池变更记录:</strong></tr>';
        sOut += '<tr>';
        sOut += '<table class="table table-striped table-bordered" cellpadding="5" cellspacing="0">';
        sOut += '<tbody>';
        sOut += '<tr>';
        sOut += '<th width="15%"><strong class="label label-warning">操作时间</strong></th>';
        sOut += '<th width="15%"><strong class="label label-warning">操作人</strong></th>';
        sOut += '<th width="15%"><strong class="label label-warning">原人才池</strong></th>';
        sOut += '<th width="15%"><strong class="label label-warning">变更后所在人才池</strong></th>';
        sOut += '<th width="20%"><strong class="label label-warning">变更原因</strong></th>';

        sOut += '</tr>';
        _.each(type_data_temp, function(temp) {
            if (temp.change_data) {
                sOut += '<tr>';
                sOut += '<td>' + moment(temp.changeDate).format('YYYY-MM-DD') + '</td>';
                sOut += '<td>' + temp.change_data.operator_name + '</td>';
                sOut += '<td>' + temp.change_data.pool_name + '</td>';
                sOut += '<td>' + temp.type_name + '</td>';
                sOut += '<td>' + temp.change_reason + '</td>';
                sOut += '</tr>';
            }
        })
        sOut += '</tbody>';
        sOut += '</table>';
    } else {
        sOut += '<tr><th colspan="4"><strong>无人才池变更记录!</strong></th></tr>';

    }
    sOut += '</tr>';
    sOut += '</tbody>';
    sOut += '</table>';
    //人才关键信息记录
    sOut += '<table class="table table-striped table-bordered" cellpadding="5" cellspacing="0" >';
    sOut += '<tbody>';

    if (type_data.length > 0) {
        var pamove = _.compact(_.filter(pa_move, function(temp) {
            return temp.people._id == String(aData[0])
        }))
        var papromotion = _.compact(_.filter(pa_promotion, function(temp) {
            return temp.people._id == String(aData[0])
        }))
        var pademotion = _.compact(_.filter(pa_demotion, function(temp) {
            return temp.people._id == String(aData[0])
        }))
        var pyadjust = _.compact(_.filter(py_adjust, function(temp) {
            return temp.people._id == String(aData[0])
        }))
        var is_true = []
        if (pamove.length > 0) {
            _.each(pamove, function(temp) {
                var operater = _.find(process_instance, function(p) {
                    return p.collection_id == String(temp._id)
                })
                is_true.push( !! operater)
            })

        }
        if (papromotion.length > 0) {
            _.each(papromotion, function(temp) {
                var operater = _.find(process_instance, function(p) {
                    return p.collection_id == String(temp._id)
                })
                is_true.push( !! operater)
            })

        }
        if (pademotion.length > 0) {
            _.each(pademotion, function(temp) {
                var operater = _.find(process_instance, function(p) {
                    return p.collection_id == String(temp._id)
                })
                is_true.push( !! operater)
            })

        }
        if (pyadjust.length > 0) {
            _.each(pyadjust, function(temp) {
                var operater = _.find(process_instance, function(p) {
                    return p.collection_id == String(temp._id)
                })
                is_true.push( !! operater)
            })

        }
        // var is_true = [];
        var warning_arr = [];
        _.each(type_data, function(temp) {
            var performance_len = _.compact(temp.performance_warning)
            warning_arr.push( !! (performance_len.length > 0))
        })
        is_true.push( !! ~warning_arr.indexOf(true))
        // var bool = !! (pamove.length > 0 || papromotion.length > 0 || pademotion.length > 0 || pyadjust.length > 0 || !! ~warning_arr.indexOf(true))
        // is_true.push(bool)
        if ( !! ~is_true.indexOf(true)) {
            // if (pamove.length > 0) {
            sOut += '<tr><strong>人才关键事件记录:</strong></tr>';
            sOut += '<tr>';
            sOut += '<table class="table table-striped table-bordered" cellpadding="5" cellspacing="0" ><tr>';
            sOut += '<tbody>';
            sOut += '<tr>';
            sOut += '<th width="15%"><strong class="label label-warning">操作时间</strong></th>';
            sOut += '<th width="15%"><strong class="label label-warning">操作人</strong></th>';
            sOut += '<th width="15%"><strong class="label label-warning">人事事件</strong></th>';
            sOut += '<th width="15%"><strong class="label label-warning">事件描述</strong></th>';
            // sOut += '<th width="15%"><strong class="label label-warning">事件原因</strong></th>';
            sOut += '<th width="20%"><strong class="label label-warning">人才池</strong></th>';
            sOut += '</tr>';
        } else {
            sOut += '<tr><th colspan="4"><strong>无人才关键事件记录!</strong></th></tr>';
        }
        if (pamove.length > 0) {
            _.each(pamove, function(temp) {
                //判断流程开始时间和在人才池的时间---得到所在人才池
                var temp_pool = _.find(type_history, function(t) {
                    return moment(t.changeDate).format('YYYYMMDD') <= moment(temp.createDate).format('YYYYMMDD') && !t.history
                })
                //通过流程实例得到流程发起人
                var operater = _.find(process_instance, function(p) {
                    return p.collection_id == String(temp._id)
                })
                if (operater) {
                    sOut += '<tr>';
                    sOut += '<td>' + moment(temp.createDate).format('YYYY-MM-DD') + '</td>';
                    if (operater) {
                        sOut += '<td>' + operater.start_user.people_name + '</td>';

                    } else {
                        sOut += '<td></td>';

                    }
                    sOut += '<td>平调</td>';
                    if (temp.src_position && temp.dest_position) {
                        var description = '从<span class="label label-info">' + temp.src_position.position_name + '</span>升职到<span class="label label-info">' + temp.dest_position.position_name;
                        sOut += '<td>' + description + '</span></td>';
                    } else {
                        sOut += '<td></td>';

                    }

                    if (temp_pool) {
                        sOut += '<td>' + temp_pool.type_name + '</td>';
                    } else {
                        sOut += '<td></td>';

                    }

                    sOut += '</tr>';
                }



            })
        }
        if (papromotion.length > 0) {
            _.each(papromotion, function(temp) {
                //判断流程开始时间和在人才池的时间---得到所在人才池
                var temp_pool = _.find(type_history, function(t) {
                    return moment(t.changeDate).format('YYYYMMDD') <= moment(temp.createDate).format('YYYYMMDD') && !t.history
                })
                //通过流程实例得到流程发起人
                var operater = _.find(process_instance, function(p) {
                    return p.collection_id == String(temp._id)
                })
                if (operater) {
                    sOut += '<tr>';
                    sOut += '<td>' + moment(temp.createDate).format('YYYY-MM-DD') + '</td>';
                    if (operater) {
                        sOut += '<td>' + operater.start_user.people_name + '</td>';

                    } else {
                        sOut += '<td></td>';

                    }
                    sOut += '<td>晋升</td>';
                    if (temp.src_position && temp.dest_position) {
                        var description = '从<span class="label label-info">' + temp.src_position.position_name + '</span>升职到<span class="label label-info">' + temp.dest_position.position_name;
                        sOut += '<td>' + description + '</span></td>';
                    } else {
                        sOut += '<td></td>';

                    }

                    if (temp_pool) {
                        sOut += '<td>' + temp_pool.type_name + '</td>';
                    } else {
                        sOut += '<td></td>';

                    }

                    sOut += '</tr>';
                }



            })
        }
        if (pademotion.length > 0) {
            _.each(pademotion, function(temp) {
                //判断流程开始时间和在人才池的时间---得到所在人才池
                var temp_pool = _.find(type_history, function(t) {
                    return moment(t.changeDate).format('YYYYMMDD') <= moment(temp.createDate).format('YYYYMMDD') && !t.history
                })
                //通过流程实例得到流程发起人
                var operater = _.find(process_instance, function(p) {
                    return p.collection_id == String(temp._id)
                })
                if (operater) {
                    sOut += '<tr>';
                    sOut += '<td>' + moment(temp.createDate).format('YYYY-MM-DD') + '</td>';
                    if (operater) {
                        sOut += '<td>' + operater.start_user.people_name + '</td>';

                    } else {
                        sOut += '<td></td>';

                    }
                    sOut += '<td>降职</td>';
                    if (temp.src_position && temp.dest_position) {
                        var description = '从<span class="label label-info">' + temp.src_position.position_name + '</span>升职到<span class="label label-info">' + temp.dest_position.position_name;
                        sOut += '<td>' + description + '</span></td>';
                    } else {
                        sOut += '<td></td>';

                    }

                    if (temp_pool) {
                        sOut += '<td>' + temp_pool.type_name + '</td>';
                    } else {
                        sOut += '<td></td>';

                    }

                    sOut += '</tr>';
                }



            })
        }
        if (pyadjust.length > 0) {
            _.each(pyadjust, function(temp) {
                //判断流程开始时间和在人才池的时间---得到所在人才池
                var temp_pool = _.find(type_history, function(t) {
                    return moment(t.changeDate).format('YYYYMMDD') <= moment(temp.createDate).format('YYYYMMDD') && !t.history
                })
                var operater = _.find(process_instance, function(p) {
                    return p.collection_id == String(temp._id)
                })
                //通过流程实例得到流程发起人
                if (operater) {

                    sOut += '<tr>';
                    sOut += '<td>' + moment(temp.createDate).format('YYYY-MM-DD') + '</td>';
                    if (operater) {
                        sOut += '<td>' + operater.start_user.people_name + '</td>';

                    } else {
                        sOut += '<td></td>';

                    }
                    sOut += '<td>调薪</td>';
                    var description_payroll = '';
                    _.each(temp.adds, function(pay) {
                        description_payroll += '工资项(' + payroll_item[pay.pic] + ')从<span class="label label-info">' + pay.current_value + '</span>调到<span class="label label-info">' + pay.new_value + '</span><br>'
                    });
                    // var description = '从<span class="label label-info">' + temp.src_position.position_name + '</span>升职到<span class="label label-info">' + temp.dest_position.position_name;
                    sOut += '<td>' + description_payroll + '</span></td>';
                    if (temp_pool) {
                        sOut += '<td>' + temp_pool.type_name + '</td>';
                    } else {
                        sOut += '<td></td>';

                    }

                    sOut += '</tr>';
                }



            })
        }
        _.each(type_data, function(temp) {
            if (temp.performance_warning.length > 0) {
                var performance_warning = temp.performance_warning
                _.each(temp.performance_warning, function(w) {
                    sOut += '<tr>';
                    sOut += '<td>' + moment(w.changeDate).format('YYYY-MM-DD') + '</td>';
                    sOut += '<td>' + w.operator_name + '</td>';
                    sOut += '<td>绩效警告</td>';
                    sOut += '<td><span class="label label-info">绩效警告通知</span></td>';
                    sOut += '<td>' + temp.type_name + '</td>';
                    sOut += '</tr>';
                })

            }
        })

    } else {
        sOut += '<tr><th colspan="4"><strong>无人才关键事件记录!</strong></th></tr>';

    }
    sOut += '</tr>';
    sOut += '</tbody>';
    sOut += '</table>';
    //人才盘点历史记录
    sOut += '<table class="table table-striped table-bordered" cellpadding="5" cellspacing="0" >';
    sOut += '<tbody>';
    if (aData) {
        var people = _.filter(lambda.attributes, function(x) {
            return x.people._id == aData[0] && x.talent_lambda.lambda_name != aData[1] && !x.history
        })
        var filter_data = _.sortBy(people, function(temp) {
            return moment(temp.talent_lambda.validFrom).format('yyyymmdd')
        })
        filter_data.reverse()
        if (filter_data.length > 0) {
            sOut += '<tr><strong>历史人才盘点记录:</strong></tr>';

            // sOut += '<tr>';
            // sOut += '<th width="15%"><strong class="label label-warning">人才盘点名称</strong></th>';
            // sOut += '<th width="15%"><strong class="label label-warning">人才盘点周期</strong></th>';
            // sOut += '<th width="15%"><strong class="label label-warning">部门</strong></th>';
            // sOut += '<th width="15%"><strong class="label label-warning">职位</strong></th>';
            // sOut += '<th width="20%"><strong class="label label-warning">所在人才池</strong></th>';
            // sOut += '<th width="20%"><strong class="label label-warning">盘点日期</strong></th>';

            // sOut += '</tr>';
            _.each(filter_data, function(x) {
                sOut += '<tr>';
                sOut += '<td><a target="_blank" href="/user/report/lambda?is_save=true&up_id=' + x.talent_lambda._id + '"><span class="label label-info">' + x.talent_lambda.lambda_name + '</span></a></td>';
                sOut += '<td>' + x.talent_lambda.lambda_period + '</td>';
                sOut += '<td>' + x.people.ou_name + '</td>';
                sOut += '<td>' + x.people.position_name + '</td>';
                sOut += '<td>' + x.type_name + '</td>';
                sOut += '<td>' + moment(x.talent_lambda.validFrom).format('YYYY-MM-DD') + '</td>';
                sOut += '</tr>';
            });
        } else {
            sOut += '<tr><th colspan="4"><strong>无历史人才盘点记录!</strong></th></tr>';
        }
    };
    sOut += '</tbody>';
    sOut += '</table>';

    return sOut;
}

    function draw_talent_single_people(p, talent_id) {
        var item = [];
        // var talent_id = people_lambda_obj[String(p._id)]
        //年薪计算
        var payroll_data = _.filter(payroll, function(pay) {
            return pay.people == String(p._id)
        })
        payroll_data = _.sortBy(payroll_data, function(pay) {
            return moment(pay.pay_end).format('yyyymmdd')
        })
        payroll_data.reverse();
        var payroll_year = 0;
        payroll_data = payroll_data.slice(0, 12);
        for (var i = 0; i < payroll_data.length; i++) {
            var amount = 0;
            // _.each(payroll_data[i].items, function(item) {
            //  amount += item.amount;
            // })
            var real_pay = _.find(payroll_data[i].items, function(item) {
                return item.pri == String(payitem._id)
            })
            amount = real_pay ? real_pay.amount : 0;
            payroll_year += amount;
        }
        var pay_month = Math.round((payroll_year / payroll_data.length) * 100) / 100
        //绩效数据过滤
        var ai_instance = _.filter(ai_data, function(temp) {
            return p._id == String(temp.people)
        })
        //能力数据过滤
        var ques_data = _.filter(ques_360, function(temp) {
            return p._id == String(temp.people)
        })
        //人才盘点数据过滤
        var lambda_p = _.filter(lambda_data, function(temp) {
            var lambda_people = temp.lambda_data;
            var lambda_h = _.find(lambda_people, function(l) {
                return l.people == String(p._id)
            })
            return !!lambda_h
        })
        var education = p.educationalbackground_name ? p.educationalbackground_name : '';
        item.push("<table><tbody><tr><td><div  id='" + p._id + "' class='span12 pricing hover-effect'>")
        item.push("<div  class='pricing-head'>")
        item.push("<h3 class='Begginer'>" + p.firstname + p.lastname + "</h3>")
        item.push("<div  class='dlg_icon'>")
        item.push("<img class='org-avatar-s img-rounded img-polaroid pull-left' style='max-width:100px; max-height:100px;' src='/gridfs/get/" + p.avatar + "'></img>")
        item.push("</div>")
        item.push("</div>")
        item.push("<ul class='pricing-content unstyled'>")
        //人事数据
        item.push("<li><i class='icon-home'></i>公司: " + p.company_name + "</li>")
        item.push("<li><i class='icon-sitemap'></i>部门: " + p.ou_name + "</li>")
        item.push("<li>");
        var sout = "<table border='0' style='width:100%'>";
        sout += '<tbody>';
        sout += '<tr>';
        sout += '<td width="40%"><i class="icon-th"></i>' + '职位: ' + p.position_name + '</td>';
        sout += '<td width="60%"><i class="icon-star"></i>' + '司龄: ' + p.years_of_service_client || '' + '</td>';
        sout += '</tr>';
        sout += '<tr>';
        sout += '<td width="40%"><i class="icon-rocket"></i>' + '学历: ' + education + '</td>';
        sout += '<td width="60%"><i class="icon-money"></i>' + '月薪: ' + '<span class ="label label-warning">' + pay_month + '</span>&nbsp;&nbsp;&nbsp;&nbsp;<a title="人员档案" target="_blank" href="/admin/masterdata/people/edit/' + p._id + '?mode=view"><i class="icon-user icon-white"></i></a></td>';
        sout += '</tr>';
        sout += '</tbody></table></li>';
        item.push(sout)
        //绩效数据
        var ai_id = p._id + "ai_id";
        item.push('<li><i class="icon-bar-chart"></i>绩效得分:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</li>')
        var sOut = "<div id='" + p._id + "ai_id' ><li>";
        sOut += "<table class='table table-striped table-bordered' cellpadding='5' cellspacing='0' >";
        sOut += '<tbody>';
        sOut += '<tr>';
        sOut += '<th width="25%"><strong >考核周期</strong></th>';
        sOut += '<th width="15%"><strong >绩效得分</strong></th>';
        sOut += '<th width="15%"><strong >绩效等级</strong></th>';
        sOut += '</tr>';
        _.each(ai_instance, function(ai) {
            sOut += '<tr>';
            sOut += '<td>' + ai.period_name + '</td>';
            sOut += '<td>' + Math.round(ai.ai_score * 100) / 100 + '</td>';
            sOut += '<td>' + ai.ai_grade + '</td>';
            sOut += '</tr>';
        })
        sOut += '</tbody>';
        sOut += '</table></li></div>';
        item.push(sOut)
        //能力数据
        var ques_id = p._id + "ques_id";
        item.push('<li><i class="icon-list-alt"></i>能力得分:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</li>')
        var sOut_2 = "<div id='" + p._id + "ques_id' ><li>";
        sOut_2 += "<table class='table table-striped table-bordered' cellpadding='5' cellspacing='0' >";
        sOut_2 += '<tbody>';
        sOut_2 += '<tr>';
        sOut_2 += '<th width="25%"><strong >问卷名称</strong></th>';
        sOut_2 += '<th width="15%"><strong >考核周期</strong></th>';
        sOut_2 += '<th width="15%"><strong >能力得分</strong></th>';
        sOut_2 += '</tr>';
        _.each(ques_data, function(ques) {
            sOut_2 += '<tr>';
            sOut_2 += '<td><a target="_blank" href="/admin/pm/questionnair_template/report_pp_list?q_id=' + ques._id + '">' + ques.qt_name + '</a></td>';
            sOut_2 += '<td>' + ques.period.period + '</td>';
            sOut_2 += '<td>' + Math.round(ques.score * 100) / 100 + '</td>';
            sOut_2 += '</tr>';
        })
        sOut_2 += '</tbody>';
        sOut_2 += '</table></li></div>';
        item.push(sOut_2)
        //人才盘点
        var lambda_id = p._id + "lambda_id";
        item.push('<li><i class="icon-group"></i>人才盘点:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</li>')
        var sOut_3 = "<div id='" + p._id + "lambda_id' ><li>";
        sOut_3 += "<table class='table table-striped table-bordered' cellpadding='5' cellspacing='0' >";
        sOut_3 += '<tbody>';
        sOut_3 += '<tr>';
        sOut_3 += '<th width="15%"><strong >盘点周期</strong></th>';
        sOut_3 += '<th width="15%"><strong >综合得分</strong></th>';
        sOut_3 += '<th width="15%"><strong >九宫图区间</strong></th>';
        // sOut_3 += '<th width="15%"><strong >人才池</strong></th>';
        sOut_3 += '</tr>';
        _.each(lambda_p, function(lambda) {
            sOut_3 += '<tr>';
            sOut_3 += '<td>' + lambda.lambda_period + '</td>';
            var lambda_people = lambda.lambda_data;
            var lambda_h = _.find(lambda_people, function(l) {
                return l.people == String(p._id)
            })
            sOut_3 += '<td>' + lambda_h.total_score + '</td>';
            sOut_3 += '<td>' + lambda_h.horoscope + '</td>';

            sOut_3 += '</tr>';
        })
        sOut_3 += '</tbody>';
        sOut_3 += '</table></li></div>';
        item.push(sOut_3)
        //人才池
        //通过人和人才盘点确定唯一一条记录
        var talenttype = _.find(talent_pool, function(temp) {
            return temp.talent_lambda == String(talent_id) && temp.people == String(p._id) && !temp.history
        })
        var type_name = talenttype ? talenttype.talent_type.type_name : '无人才池数据';
        item.push('<li><i class="icon-inbox"></i>当前所在人才池:&nbsp;&nbsp;&nbsp;&nbsp<span class="label label-warning">' + type_name + '</span></li>')
        item.push("</ul>")
        item.push("</div></td></tr></tbody></table>")
        // item.push('<div class="span12" style="height:180px"></div>')

        return item.join('')

    }

    function draw_talent(p_data, people_lambda_obj) {
        var item = [];
        var index_arr = [];

        _.each(p_data, function(p) {
            index_arr.push(String(p._id))
        })
        _.each(p_data, function(p) {
            var talent_id = people_lambda_obj[String(p._id)]
            //年薪计算
            var payroll_data = _.filter(payroll, function(pay) {
                return pay.people == String(p._id)
            })
            payroll_data = _.sortBy(payroll_data, function(pay) {
                return moment(pay.pay_end).format('yyyymmdd')
            })
            payroll_data.reverse();
            var payroll_year = 0;
            payroll_data = payroll_data.slice(0, 12);
            for (var i = 0; i < payroll_data.length; i++) {
                var amount = 0;
                // _.each(payroll_data[i].items, function(item) {
                //  amount += item.amount;
                // })
                var real_pay = _.find(payroll_data[i].items, function(item) {
                    return item.pri == String(payitem._id)
                })
                amount = real_pay ? real_pay.amount : 0;
                payroll_year += amount;
            }
            var pay_month = Math.round((payroll_year / payroll_data.length) * 100) / 100
            //绩效数据过滤
            var ai_instance = _.filter(ai_data, function(temp) {
                return p._id == String(temp.people)
            })
            //能力数据过滤
            var ques_data = _.filter(ques_360, function(temp) {
                return p._id == String(temp.people)
            })
            //人才盘点数据过滤
            var lambda_p = _.filter(lambda_data, function(temp) {
                var lambda_people = temp.lambda_data;
                var lambda_h = _.find(lambda_people, function(l) {
                    return l.people == String(p._id)
                })
                return !!lambda_h
            })
            var education = p.educationalbackground_name ? p.educationalbackground_name : '';
            append_id.push(p._id)
            var index = index_arr.indexOf(String(p._id))
            var result = parseInt(index) % 3;
            if (result == 0) {
                if (index != 0) {
                    item.push("</div>")
                }
                item.push('<div class="row-fluid">')
            }
            item.push("<div  id='" + p._id + "' class='span4 pricing hover-effect'>")
            item.push("<div  class='pricing-head'>")
            item.push('<button style="margin-top: 5px;margin-left: 10px;" class="close" type="button" onclick="del_pep(%'' + p._id + '%')" title="删除"></button>')
            item.push("<h3 class='Begginer'>" + p.firstname + p.lastname + "</h3>")
            item.push("<div  class='dlg_icon'>")
            item.push("<img class='org-avatar-s img-rounded img-polaroid pull-left' style='max-width:100px; max-height:100px;' src='/gridfs/get/" + p.avatar + "'></img>")
            item.push("</div>")
            item.push("</div>")
            item.push("<ul class='pricing-content unstyled'>")
            //人事数据
            item.push("<li><i class='icon-home'></i>公司: " + p.company_name + "</li>")
            item.push("<li><i class='icon-sitemap'></i>部门: " + p.ou_name + "</li>")
            // item.push("<li><i class='icon-th'></i>" + "职位: " + p.position_name + "")
            // item.push("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp<i class='icon-star'></i>司龄: " + p.years_of_service_client || '' + "</li>")
            // item.push("<li><i class='icon-rocket'></i>" + "学历: " + education + "")
            // item.push("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp<i class='icon-money'></i>" + "月薪: " + "<span class ='label label-warning'>" + pay_month + "</span>" + "&nbsp;&nbsp;&nbsp;&nbsp;<a title='人员档案' target='_blank' href='/admin/masterdata/people/edit/" + p._id + "?mode=view'><i class='icon-user icon-white'></i></a></li>")
            item.push("<li>");
            var sout = "<table border='0' style='width:100%'>";
            sout += '<tbody>';
            sout += '<tr>';
            sout += '<td width="40%"><i class="icon-th"></i>' + '职位: ' + p.position_name + '</td>';
            sout += '<td width="60%"><i class="icon-star"></i>' + '司龄: ' + p.years_of_service_client || '' + '</td>';
            sout += '</tr>';
            sout += '<tr>';
            sout += '<td width="40%"><i class="icon-rocket"></i>' + '学历: ' + education + '</td>';
            sout += '<td width="60%"><i class="icon-money"></i>' + '月薪: ' + '<span class ="label label-warning">' + pay_month + '</span>&nbsp;&nbsp;&nbsp;&nbsp;<a title="人员档案" target="_blank" href="/admin/masterdata/people/edit/' + p._id + '?mode=view"><i class="icon-user icon-white"></i></a></td>';
            sout += '</tr>';
            sout += '</tbody></table></li>';
            item.push(sout)
            //绩效数据
            var ai_id = p._id + "ai_id";
            item.push('<li><i class="icon-bar-chart"></i>绩效得分:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + '<a onclick="hide_data(%'' + ai_id + '%')"><i class="icon-zoom-in"></i></a><a title="绩效得分明细" target="_blank" href="/user/report/emp_myperformance?people=' + p._id + '"><i class="icon-plane"></i></a></li>')
            var sOut = "<div id='" + p._id + "ai_id' style='display:none'><li>";
            sOut += "<table class='table table-striped table-bordered' cellpadding='5' cellspacing='0' >";
            sOut += '<tbody>';
            sOut += '<tr>';
            sOut += '<th width="25%"><strong >考核周期</strong></th>';
            sOut += '<th width="15%"><strong >绩效得分</strong></th>';
            sOut += '<th width="15%"><strong >绩效等级</strong></th>';
            sOut += '</tr>';
            _.each(ai_instance, function(ai) {
                sOut += '<tr>';
                sOut += '<td>' + ai.period_name + '</td>';
                sOut += '<td>' + Math.round(ai.ai_score * 100) / 100 + '</td>';
                sOut += '<td>' + ai.ai_grade + '</td>';
                sOut += '</tr>';
            })
            sOut += '</tbody>';
            sOut += '</table></li></div>';
            item.push(sOut)
            //能力数据
            var ques_id = p._id + "ques_id";
            item.push('<li><i class="icon-list-alt"></i>能力得分:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + '<a onclick="hide_data(%'' + ques_id + '%')"><i class="icon-zoom-in"></i></a><a title="能力得分明细" target="_blank" href="/admin/pm/questionnair_template/report360"><i class="icon-plane"></i></a></li>')
            var sOut_2 = "<div id='" + p._id + "ques_id' style='display:none'><li>";
            sOut_2 += "<table class='table table-striped table-bordered' cellpadding='5' cellspacing='0' >";
            sOut_2 += '<tbody>';
            sOut_2 += '<tr>';
            sOut_2 += '<th width="25%"><strong >问卷名称</strong></th>';
            sOut_2 += '<th width="15%"><strong >考核周期</strong></th>';
            sOut_2 += '<th width="15%"><strong >能力得分</strong></th>';
            sOut_2 += '</tr>';
            _.each(ques_data, function(ques) {
                sOut_2 += '<tr>';
                sOut_2 += '<td><a target="_blank" href="/admin/pm/questionnair_template/report_pp_list?q_id=' + ques._id + '">' + ques.qt_name + '</a></td>';
                sOut_2 += '<td>' + ques.period.period + '</td>';
                sOut_2 += '<td>' + Math.round(ques.score * 100) / 100 + '</td>';
                sOut_2 += '</tr>';
            })
            sOut_2 += '</tbody>';
            sOut_2 += '</table></li></div>';
            item.push(sOut_2)
            //人才盘点
            var lambda_id = p._id + "lambda_id";
            item.push('<li><i class="icon-group"></i>人才盘点:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + '<a onclick="hide_data(%'' + lambda_id + '%')"><i class="icon-zoom-in"></i></a><a title="人才盘点清单" target="_blank" href="/user/report/lambda_list"><i class="icon-plane"></i></a></li>')
            var sOut_3 = "<div id='" + p._id + "lambda_id' style='display:none'><li>";
            sOut_3 += "<table class='table table-striped table-bordered' cellpadding='5' cellspacing='0' >";
            sOut_3 += '<tbody>';
            sOut_3 += '<tr>';
            sOut_3 += '<th width="15%"><strong >盘点周期</strong></th>';
            sOut_3 += '<th width="15%"><strong >综合得分</strong></th>';
            sOut_3 += '<th width="15%"><strong >九宫图区间</strong></th>';
            // sOut_3 += '<th width="15%"><strong >人才池</strong></th>';
            sOut_3 += '</tr>';
            _.each(lambda_p, function(lambda) {
                sOut_3 += '<tr>';
                sOut_3 += '<td>' + lambda.lambda_period + '</td>';
                var lambda_people = lambda.lambda_data;
                var lambda_h = _.find(lambda_people, function(l) {
                    return l.people == String(p._id)
                })
                sOut_3 += '<td>' + lambda_h.total_score + '</td>';
                sOut_3 += '<td>' + lambda_h.horoscope + '</td>';

                sOut_3 += '</tr>';
            })
            sOut_3 += '</tbody>';
            sOut_3 += '</table></li></div>';
            item.push(sOut_3)
            //人事流程
            item.push("<li><i class='icon-stethoscope'></i>人事流程:</li>")
            item.push('<li><button type="button" onclick="add_up(%'' + p._id + '%',%'' + p.people_name + '%',%'' + talent_id + '%')" class="btn btn-info">升职</button><button onclick="position_leave(%'' + p._id + '%',%'' + p.people_name + '%',%'' + talent_id + '%')" type="button" class="btn btn-info">降级</button>')
            item.push('<button type="button" onclick="position_change(%'' + p._id + '%',%'' + p.people_name + '%',%'' + talent_id + '%')" class="btn btn-info">调岗</button><button onclick="pay_adj(%'' + p._id + '%',%'' + p.people_name + '%',%'' + talent_id + '%')" type="button" class="btn btn-info">调薪</button></li>')

            // item.push('<li><label>人才池</label><button type="button" class="btn btn-small" onclick="add_up(%'' + p._id + '%')" ><i class="icon-plus"></i></button></li>')
            //人员生命周期
            item.push("<li><i class='icon-stackexchange'></i>员工生命周期图:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + "<a target='_blank' href='/admin/masterdata/people/people_life_cycle?people=" + p._id + "'><i class='icon-plane'></i></a></li>")
            //人才池
            //通过人和人才盘点确定唯一一条记录
            var talenttype = _.find(talent_pool, function(temp) {
                return temp.talent_lambda == String(talent_id) && temp.people == String(p._id) && !temp.history
            })
            // console.log(talenttype);
            var type_name = talenttype ? talenttype.talent_type.type_name : '无人才池数据';
            item.push('<li><i class="icon-inbox"></i>当前所在人才池:&nbsp;&nbsp;&nbsp;&nbsp<span class="label label-warning">' + type_name + '</span></li>')
            item.push('<li><i class="icon-inbox"></i>放到人才池:&nbsp;&nbsp;&nbsp;&nbsp')
            var pool = "<div class='btn-group'>";
            pool += "<button class='btn purple' href='#' data-toggle='dropdown'>";
            pool += '<i class="icon-inbox"></i>';
            pool += '<i class="icon-angle-down"></i>';
            pool += '</button>'
            pool += '<ul class="dropdown-menu">';
            if (talenttype) {
                var filter_type = _.filter(talent_type, function(type) {
                    return type._id != talenttype.talent_type._id;
                })
            } else {
                var filter_type = talent_type
            }

            _.each(filter_type, function(temp) {
                pool += '<li><a onclick="change_pool(%'' + p._id + '%',%'' + temp._id + '%',%'' + talent_id + '%')" href="javascript:void(0);" data-up_id="' + temp._id + '">' + temp.type_name + '</a></li>'
            })
            // pool += '<li><a href="#">绩效警告</a></li>'
            // pool += '<li><a href="#">晋升清单</a></li>'
            pool += "</ul></div></li>";
            item.push(pool);
            // item.push("<li><button type='button' class='btn btn-info'>加入淘汰清单</button></li>")
            // item.push('<li><button type="button" onclick="add_up(%'' + p._id + '%')" class="btn btn-info">加入晋升清单</button><button onclick="add_learn(%'' + p._id + '%')" type="button" class="btn btn-info">加入培养计划</button></li>')
            item.push("</ul>")
            item.push("</div>")
        })
        item.push('<div class="span12" style="height:180px"></div>')

        $("#droppable").append(item.join(''))
        // $("#droppable").trigger("liszt:updated");

    }

    function del_pep(id) {
        $("#" + id).remove()
        append_id = _.filter(append_id, function(temp) {
            return temp != String(id)
        })
    }
var show = true;

function hide_data(id) {
    if (show == true) {
        $("#" + id).show()
        show = false;
    } else {
        $("#" + id).hide()
        show = true;
    }
    return show;
}

function add_up(id, name, talent_id) {
    window.location.href = '/admin/pa/wf/promotion/start?people=' + id + '&people_name=' + name + '&lambda_id=' + talent_id
}

function pay_adj(id, name, talent_id) {
    window.location.href = '/admin/py/payroll_adjustment/start?people=' + id + '&people_name=' + name + '&lambda_id=' + talent_id
}
//平调
function position_change(id, name, talent_id) {
    window.location.href = '/admin/pa/wf/move/start?people=' + id + '&people_name=' + name + '&lambda_id=' + talent_id
}
//降级
function position_leave(id, name, talent_id) {
    window.location.href = '/admin/pa/wf/demotion/start?people=' + id + '&people_name=' + name + '&lambda_id=' + talent_id
}
//晋升
//人才池转换
function change_pool(p_id, type_id, talent_id) {
    // var obj = {}
    obj = {
        people: p_id,
        talent_type: type_id,
        talent_id: talent_id
    }
    $("#ihModalLabel").show();
    $("#ihModalLabel").html('人才池-转换')
    $("#ihModal").modal();
}
