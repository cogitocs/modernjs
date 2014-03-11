var
    tblAlreadycompany,
    forced_company,
    otblOPs;
var detail_com, is_forced, period_name, force_again;
$(document).ready(function() {

    // setup tblOPss
    var dontSortPeople = [];
    $('#tblOPs thead th').each(function() {
        if ($(this).hasClass('no_sort')) {
            dontSortPeople.push({
                "bSortable": false
            });
        } else {
            dontSortPeople.push(null);
        }
    });
    var datatable_option = {
        "bPaginate": true,

        "sPagicostcenterType": "full_numbers",
        "bAutoWidth": false,
        "bJQueryUI": false,
        "aaSorting": [
            [1, "asc"],
        ],
        "aoColumns": dontSortPeople,
        "aoColumnDefs": [{
            "sName": "people_no",
            "aTargets": [0]
        }, {
            "sName": "people_name",
            "aTargets": [1]
        }, {
            "sName": "position_name",
            "aTargets": [4]
        }, {
            "sName": "ou_name",
            "aTargets": [5]
        }],
        "oLanguage": {
            "sUrl": (i18n.lng() == 'zh') ? "/pagejs/dataTables.chinese.json" : ""
        },
        "fnDrawCallback": function(oSettings) {
            $('#tblOPs').find('i, div').tooltip();
        },
        "iDisplayLength": 10,
        // "sScrollX": "100px",
        // "sScrollXInner": "160%",
        // "bScrollCollapse": false,
        "fnInitComplete": function(oSettings, json) {
            $(".chzn-select, .dataTables_length select").chosen({
                disable_search_threshold: 10
            });
            // new FixedColumns($('#tblOPs').dataTable(), {
            //     "iLeftColumns": 2,
            //     "iLeftWidth": "150",
            // });
            $('.dataTables_filter input').unbind();
            $('.dataTables_filter input').on('keyup', function(e) {
                if (e.keyCode == 13) {
                    $('#tblOPs').dataTable().fnFilter($(this).val());
                }
                e.stopPropagation();
            });

        },
        "bProcessing": true,
        "bServerSide": true,
        "sAjaxSource": "/admin/pm/force_distribution_group/force",
        "fnServerParams": function(aoData) {
            // event.preventDefault();
            aoData.push({
                "name": "detail_com",
                "value": detail_com
            }, {
                "name": "is_forced",
                "value": is_forced
            }, {
                "name": "period_name",
                "value": period_name
            }, {
                "name": "force_again",
                "value": force_again
            });
            //公司
            var company = $("#company").val();
            aoData.push({
                "name": "company",
                "value": company
            });
            //年度
            var year = $("#year").val();
            aoData.push({
                "name": "year",
                "value": year
            });
            var all_checked = $("#filter_cond").find('input[type=checkbox]:checked');
            //周期类型
            //年度
            var annual = all_checked.filter('[name=annual]');
            if (annual.length) {
                aoData.push({
                    "name": "annual",
                    "value": 0
                });
            };
            //半年度

            var halfyear = _.map(all_checked.filter('[name=halfyear]'), function(x) {
                return $(x).val();
            });
            if (halfyear.length) {
                aoData.push({
                    "name": "halfyear",
                    "value": JSON.stringify(halfyear)
                });
            };
            // 季度   
            var quarter = _.map(all_checked.filter('[name=quarter]'), function(x) {
                return $(x).val();
            });
            if (quarter.length) {
                aoData.push({
                    "name": "quarter",
                    "value": JSON.stringify(quarter)
                });
            };
            // 月度
            var month = _.map(all_checked.filter('[name=month]'), function(x) {
                return $(x).val();
            });
            if (month.length) {
                aoData.push({
                    "name": "month",
                    "value": JSON.stringify(month)
                });
            };

        },
        "fnServerData": function(sSource, aoData, fnCallback) {
            $.ajax({
                "dataType": 'json',
                "type": "POST",
                "url": sSource,
                "data": aoData,
                "success": fnCallback,
            });
        },

    }
    // console.log($('#tblOPs').dataTable().fnGetData());                                         
    $('#tblOPs').dataTable(datatable_option);

    $("#btn_list_graph").on('click', function() {
        window.location = '/user/report/emp_performance_graph';
    })
    $.extend($.fn.dataTableExt.oStdClasses, {
        "s`": "dataTables_wrapper form-inline"
    });
    $("#btn_list_filter").on('click', function(e) {
        var $this = $(this).button('toggle');
        if ($this.hasClass('active')) {
            $("#filter_cond").show();
        } else {
            $("#filter_cond").hide();
        };
    });
    $(".chzn-select").chosen({
        disable_search_threshold: 10
    });
    $("#filter_cond").on('click', 'input[type=checkbox]', function(event) {
        $('#tblOPs').dataTable().fnDraw();
    });
    $("#year").on('change', function(event) {
        event.preventDefault();
        $('#tblOPs').dataTable().fnDraw();
    });
    $("#company").on('change', function(event) {
        event.preventDefault();
        if (confirm('强制分布配置是否已完成？')) {
            $('#tblOPs').dataTable().fnDraw();
        }
    });
    $("button:[name='show_peoples']").live('click', function(e) {
        var event_obj = $(e.currentTarget);
        // var cc_id = event_obj.val();
        var cc_tr = event_obj.parent().parent().parent();
        var aData = otblAlreadycompany.fnGetData(cc_tr[0]);
        detail_com = aData[0];
        is_forced = true;
        period_name = aData[2];
        $('#tblOPs').dataTable().fnDraw();
    })
    $("button:[name='force_again']").live('click', function(e) {
        var event_obj = $(e.currentTarget);
        var cc_tr = event_obj.parent().parent().parent();
        var aData = otblAlreadycompany.fnGetData(cc_tr[0]);
        force_again = aData[0];
        if (confirm('强制分布配置是否已完成？')) {
            $('#tblOPs').dataTable().fnDraw();
        }

    })
    var dontSort = [];
    $('#tblAlreadycompany thead th').each(function() {
        if ($(this).hasClass('no_sort')) {
            dontSort.push({
                "bSortable": false
            });
        } else {
            dontSort.push(null);
        }
    });
    otblAlreadycompany = $('#tblAlreadycompany').dataTable({
        //"sDom": "<'row-fluid table_top_bar'<'span12'<'to_hide_phone' f>>>t<'row-fluid control-group full top' <'span4 to_hide_tablet'l><'span8 pagination'p>>",
        "aoColumnDefs": [{ //第一列用来保存id，隐藏
            "bSearchable": false,
            "bVisible": false,
            "aTargets": [0]
        }],
        "aaSorting": [
            [0, "asc"],
        ],
        "bPaginate": true,
        "sPagicostcenterType": "full_numbers",
        "bAutoWidth": false,
        "bJQueryUI": false,
        "aoColumns": dontSort,
        "oLanguage": {
            "sUrl": (i18n.lng() == 'zh') ? "/pagejs/dataTables.chinese.json" : ""
        },
        "fnInitComplete": function(oSettings, json) {
            $(".chzn-select, .dataTables_length select").chosen({
                disable_search_threshold: 10
            });
        }
    });
    get_forced_data();
    $("#company").on('click', function() {
        if (confirm('强制分布配置是否已完成？')) {
            $.get('/admin/structure/company/input_help_pe', function(data) {
                if (data) {
                    $("#ihModalLabel").html("公司－列表选择");
                    $("#ih_table").html(data);
                    $("#ihModal").modal();
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
                    $('#make_sure').on('click', function() {
                        var com_id = [];
                        $("input[id='obj_id']").each(function() {
                            if ($(this).attr("checked")) {
                                if ($(this).val() != "") {
                                    com_id.push($(this).val());
                                }

                            }
                        })
                        $("#company").val(com_id);
                        $('#tblOPs').dataTable().fnDraw();
                        $("#ihModal").modal('hide');
                    })
                };
            })

        }

    })
});

function get_forced_data() {
    $.post('/admin/pm/force_distribution_group/get_forced_data', function(data) {
        if (data.code == 'OK') {
            forced_company = data.data;
            if (otblAlreadycompany) {
                otblAlreadycompany.fnClearTable()
            };
            var forced_company_key = _.keys(forced_company);
            _.each(forced_company_key, function(cp) {
                var items = [];
                items.push('<div class="btn-group">');
                items.push('<button class="btn btn-small" name="force_again"  type="button" ><i class="icon-legal" title="重新强制分布"> 重 算</i></button>')
                // items.push('<a class="btn btn-small" onclick="to_trial(\'' + cp + '\')" ><i class="icon-legal" title="重新强制分布"> 重 算</i></a>') 
                items.push('<button class="btn btn-small" name="show_peoples"  type="button" ><i class="icon-eye-open" title="查看明细"> 明 细</i></button>')
                items.push('</div>')
                var values_data = forced_company[cp] ? forced_company[cp] : ''
                var obj = {
                    '0': '一月',
                    '1': '二月',
                    '2': '三月',
                    '3': '四月',
                    '4': '五月',
                    '5': '六月',
                    '6': '七月',
                    '7': '八月',
                    '8': '九月',
                    '9': '十月',
                    '10': '十一月',
                    '11': '十二月'
                }
                var obj2 = {
                    '1': '年度',
                    '2': '半年',
                    '3': '季度',
                    '4': '月度',
                    '5': '周'
                }
                // var period_year = [];
                // _.each(values_data, function(temp) {
                //     period_year.push(temp.year);
                // })

                // var period_year_uniq = _.uniq(period_year);
                // _.each(period_year_uniq, function(year) {
                //     var type_data = _.filter(values_data, function(data) {
                //         return year == data.year
                //     })
                //     var period_type = [];
                //     _.each(type_data, function(temp) {
                //         period_type.push(temp.period_type)
                //     })
                //     var period_type_uniq = _.uniq(period_type);
                //     _.each(period_type_uniq, function(type) {
                //         var value_data = _.filter(type_data, function(value) {
                //             return value.period_type == type
                //         })
                //         var period_value = [];
                //         _.each(value_data, function(value) {
                //             period_value.push(value.period_value);
                //         })
                //         var period_uniq = _.uniq(period_value);
                //         _.each(period_uniq, function(temp) {
                //             var filter_period = _.find(value_data, function(value) {
                //                 return temp == value.period_value
                //             })
                //             otblAlreadycompany.fnAddData([
                //                 cp,
                //                 filter_period.people.company_name,
                //                 filter_period.year,
                //                 obj2[filter_period.period_type],
                //                 obj[temp],
                //                 items.join('')
                //             ]);
                //         })
                //     })

                // })
                var period_name = [];
                _.each(values_data, function(temp) {
                    period_name.push(temp.period_name);
                })
                var period_name_uniq = _.uniq(period_name);
                _.each(period_name_uniq, function(name) {
                    var name_data = _.find(values_data, function(value) {
                        return value.period_name == name
                    })
                    otblAlreadycompany.fnAddData([
                        cp,
                        name_data.people.company_name,
                        name,
                        items.join('')
                    ]);
                })
                $("i").tooltip()
            })
        };

    })
}
