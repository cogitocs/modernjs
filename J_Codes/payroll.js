/*
Schema for payroll management.
薪酬管理：
1、薪酬项目：用来构成薪酬方案。重要属性为加项还是减项
2、薪酬方案：由薪酬项目组合而成，一个client可有多种薪酬方案，但一个people在一个时间段只能对应一个薪酬方案。
3、算薪公式：与薪酬方案一一对应，用来存储薪酬方案中的薪酬项目的计算规则。
4、银行帐户信息：用来存储员工工资卡的信息（收款人，开户行，卡号）
4.1、公积金帐号信息
4.2、养老金帐号信息
4.3、医疗保险帐号
5、薪酬等级：做薪酬规划使用。

流程：薪资调整流程－薪资调整确认单

*/

// 基本工资    岗位工资    绩效工资    提成工资    计件工资    工龄工资    福利补贴    税前应发合计  缺勤扣款    考勤扣款    行政处罚扣款  失业保险    工伤保险    养老保险    医疗保险    生育保险    住房公积金   税前应扣合计  应发合计    应扣个税    应扣借款    现金补贴    实发合计
// P01 P02 P03 P04 P05 P06 P07 P20 P31 P32 P33 P34 P35 P36 P37 P38 P39 P40 P50 P60 P70 P80 P90

var mongoose = require('mongoose');
var valid = require('./valid');
var us = require('underscore');
var async = require('async');
// 薪酬核算使用

// 银行帐户信息——个人；一个人员可以有多个银行帐户，代发工资使用，关联到People表
var BankAccountSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    account_no: { //帐号／卡号
        type: String,
        required: true
    },
    account_name: { //收款人姓名
        type: String,
        required: true
    },
    account_bank: { //开户行
        type: String,
        required: true
    },
    currency: { //支付的货币，默认CNY
        type: String,
        default: 'CNY'
    },
    usage: { //用途 1:工资发放 2:费用报销 3:现金补贴 4:其他
        type: String,
        'enum': ['1', '2', '3', '4'],
        default: '1'
    }
})
BankAccountSchema.plugin(valid);
BankAccountSchema.index({
    client: 1,
    account_no: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.BankAccountSchema = BankAccountSchema;
// 社会保险帐号类型－平台级数据字典
SocialInsuranceAccountTypeSchema = mongoose.Schema({
    account_type: {
        type: String,
        required: true,
        // unique: true
    },
    area_group: [{ //社保账号应用范围分组
        area_group: String,
        // required:true
    }],
    // pri_per: [{ //福利项（公司，个人）
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'PayrollItemClient'
    // }],
    pri_per: { //福利项（公司，个人）
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItem'
    },
    pri_com: { //福利项（公司，个人）
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItem'
    }

})
module.exports.SocialInsuranceAccountTypeSchema = SocialInsuranceAccountTypeSchema;

// 社会保险帐号类型－客户级数据字典
SocialInsuranceAccountTypeClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    account_type: {
        type: String,
        required: true,
        // unique: true
    },
    area_group: [{ //社保账号应用范围分组
        area_group: String,
        // required:true
    }],
    pri_per: { //福利项（公司，个人）
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    },
    pri_com: { //福利项（公司，个人）
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    }
})
module.exports.SocialInsuranceAccountTypeClientSchema = SocialInsuranceAccountTypeClientSchema;
// 社会保险帐号应用范围－平台级数据字典
SocialInsuranceAccountAreaSchema = mongoose.Schema({
    account_type: { //作废，改为工资项进来关联
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SocialInsuranceAccountType',
        required: true
    },
    // payroll_item: { //福利保险工资项
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'PayrollItem'
    // },//作废
    city: [{
        city_code: { //城市／区域，从DDIC中选择
            type: String,
            required: true
        },
        city_name: { //城市／区域，从DDIC中选择
            type: String,
            required: true
        },

    }],
    nation_code: {
        type: String,
        required: true
    },
    nation_name: {
        type: String,
        required: true
    },
    province_code: {
        type: String,
        required: true
    },
    province_name: {
        type: String,
        required: true
    },
    group: { //分组。 用来区分同一城市下对应不同人群的政策。例如：城镇户口、农村户口、占住证等
        type: String,
    },
    ceiling: { //缴存基数－上限
        type: Number,
        default: Infinity
    },
    floor: { //缴存基数－下限
        type: Number,
        default: 0
    },
    ratio_p: { //缴存比例－个人
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    ratio_p_i: {
        value: { //乘以比例后所加的截距
            type: Number,
            default: 0
        },
        value_year: { //年度附加值
            type: Number,
        },
        month: { //年度附加值 关联的月份
            type: Number,
            default: 12
        },
        // is_year: {
        //     type: Boolean,
        //     default: false //为false时按月度算
        // },
        // is_month: {
        //     type: Boolean,
        //     default: true //为false时按月度算
        // }
    },
    ratio_c: { //缴存比例－公司
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    ratio_c_i: {
        value: { //乘以比例后所加的截距
            type: Number,
            default: 0
        },
        value_year: { //年度附加值
            type: Number,
        },
        month: { //年度附加值 关联的月份
            type: Number,
            default: 12
        },
        // is_year: {
        //     type: Boolean,
        //     default: false //为false时按月度算
        // },
        // is_month: {
        //     type: Boolean,
        //     default: true //为false时按月度算
        // }
    }
})
SocialInsuranceAccountAreaSchema.plugin(valid);

module.exports.SocialInsuranceAccountAreaSchema = SocialInsuranceAccountAreaSchema;

// 社会保险帐号应用范围－客户级数据字典（可以从平台数据复制，也可以自己添加，未来可以从客户的数据库贡献到平台级数据库）
SocialInsuranceAccountAreaClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    account_type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SocialInsuranceAccountTypeClient',
        required: true
    },
    // payroll_item: { //福利保险工资项
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'PayrollItemClient'
    // },//作废
    city: [{
        city_code: { //城市／区域，从DDIC中选择
            type: String,
            required: true
        },
        city_name: { //城市／区域，从DDIC中选择
            type: String,
            required: true
        },

    }],
    nation_code: {
        type: String,
        required: true
    },
    nation_name: {
        type: String,
        required: true
    },
    province_code: {
        type: String,
        required: true
    },
    province_name: {
        type: String,
        required: true
    },
    group: { //分组。 用来区分同一城市下对应不同人群的政策。例如：城镇户口、农村户口、占住证等
        type: String,
    }, //作废
    // group: [{ //社保账号应用范围分组
    //     area_group: String,
    //     // required:true
    // }],
    ceiling: { //缴存基数－上限
        type: Number,
        default: Infinity
    },
    floor: { //缴存基数－下限
        type: Number,
        default: 0
    },
    ratio_p: { //缴存比例－个人
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    ratio_p_i: {
        value: { //乘以比例后所加的截距    //月度附加值
            type: Number,
            default: 0,
        },
        value_year: { //年度附加值
            type: Number,
            default: 0

        },
        month: { //年度附加值 关联的月份
            type: Number,
            default: 12
        },
        // is_year: {
        //     type: Boolean,
        //     default: false //为false时按月度算
        // },
        // is_month: {
        //     type: Boolean,
        //     default: true //为true时按月度算
        // }
    },
    // ratio_p_i: { //乘以比例后所加的截距
    //     type: Number,
    //     default: 0
    // },
    ratio_c: { //缴存比例－公司
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    ratio_c_i: {
        value: { //乘以比例后所加的截距
            type: Number,
            default: 0
        },
        value_year: { //年度附加值
            type: Number,
            default: 0
        },
        month: { //年度附加值 关联的月份
            type: Number,
            default: 12
        },
        // is_year: {
        //     type: Boolean,
        //     default: false //为false时按月度算
        // },
        // is_month: {
        //     type: Boolean,
        //     default: true //为false时按月度算
        // }
    }
    // ratio_c_i: { //乘以比例后所加的截距
    //     type: Number,
    //     default: 0
    // },
})
SocialInsuranceAccountAreaClientSchema.plugin(valid);

module.exports.SocialInsuranceAccountAreaClientSchema = SocialInsuranceAccountAreaClientSchema;


// 社会保险帐号信息——个人（帐号类型从帐号类型库中选择）
var SocialInsuranceAccountSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: { //人员
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    people_no: {
        type: String,
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    nation_code: {
        type: String,
    },
    nation_name: {
        type: String,
    },
    province_code: {
        type: String,
    },
    province_name: {
        type: String,
    },

    social_policy: { //社保政策
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SocialInsurancePolicy',
    },
    last_social_base: { //上一年缴存基数
        type: Number
    },
    social_base: { //缴存基数
        type: Number
    }
    // wel_data: [{
    //     account_type: { //社会保险帐号类型(系统提供批量给定)
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'SocialInsuranceAccountType',
    //         // required: true
    //     },
    //     account_area: { //社会保险帐号适用地区(系统提供批量给定)
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'SocialInsuranceAccountAreaClient',
    //         // required: true
    //     },
    //     group: { //分组。 用来区分同一城市下对应不同人群的政策。例如：城镇户口、农村户口、占住证等
    //         type: String,
    //     },
    //     ceiling: { //缴存基数－上限
    //         type: Number,
    //         default: 0
    //     },
    //     floor: { //缴存基数－下限
    //         type: Number,
    //         default: 0
    //     },
    //     ratio_p: { //缴存比例－个人(可从关联的帐户配置带过来，也可以直接修改)
    //         type: Number,
    //         min: 0,
    //         max: 100,
    //         default: 0
    //     },
    //     ratio_c: { //缴存比例－公司(可从关联的帐户配置带过来，也可以直接修改)
    //         type: Number,
    //         min: 0,
    //         max: 100,
    //         default: 0
    //     },
    //     ratio_p_i: { //乘以比例后所加的截距
    //         type: Number,
    //         default: 0
    //     },
    //     ratio_c_i: { //乘以比例后所加的截距
    //         type: Number,
    //         default: 0
    //     },
    // }]

})
module.exports.SocialInsuranceAccountSchema = SocialInsuranceAccountSchema;

//社保政策配置
var SocialInsurancePolicySchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    policy_name: {
        type: String,
        required: true
    },
    nation_code: {
        type: String,
        required: true
    },
    nation_name: {
        type: String,
        required: true
    },
    province_code: {
        type: String,
        required: true
    },
    province_name: {
        type: String,
        required: true
    },
    account_area: [{ //社会保险帐号适用地区(系统提供批量给定)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SocialInsuranceAccountAreaClient',
    }],
    //废弃
    // account_type: [{ //社会保险帐号类型(系统提供批量给定)
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'SocialInsuranceAccountType',
    // }],
})
module.exports.SocialInsurancePolicySchema = SocialInsurancePolicySchema;

//平台级社保政策配置
var SocialInsurancePolicyPlatSchema = mongoose.Schema({
    policy_name: {
        type: String,
        required: true
    },
    nation_code: {
        type: String,
        required: true
    },
    nation_name: {
        type: String,
        required: true
    },
    province_code: {
        type: String,
        required: true
    },
    province_name: {
        type: String,
        required: true
    },
    account_area: [{ //社会保险帐号适用地区(系统提供批量给定)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SocialInsuranceAccountArea',
    }],
})
module.exports.SocialInsurancePolicyPlatSchema = SocialInsurancePolicyPlatSchema;
// // 社保公积金帐号信息——个人（帐号类型从帐号类型库中选择）
// var SocialInsuranceAccountPersonalSchema = mongoose.Schema({
//     client: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Client'
//     },
//     // account_no: { //帐号
//     //     type: String,
//     //     required: true
//     // },
//     // account_name: { //姓名
//     //     type: String,
//     //     required: true
//     // },
//     people: { //人员
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'People'
//     },
//     account_type: { //社会保险帐号类型(系统提供批量给定)
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'SocialInsuranceAccountType',
//         required: true
//     },
//     account_area: { //社会保险帐号适用地区(系统提供批量给定)
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'SocialInsuranceAccountAreaClient',
//         required: true
//     },
//     // base: { //缴存基数
//     //     type: Number,
//     //     default: 0
//     // },
//     ceiling: { //缴存基数－上限
//         type: Number,
//         default: 0
//     },
//     floor: { //缴存基数－下限
//         type: Number,
//         default: 0
//     },
//     ratio_p: { //缴存比例－个人(可从关联的帐户配置带过来，也可以直接修改)
//         type: Number,
//         min: 0,
//         max: 100,
//         default: 0
//     },
//     ratio_c: { //缴存比例－公司(可从关联的帐户配置带过来，也可以直接修改)
//         type: Number,
//         min: 0,
//         max: 100,
//         default: 0
//     },
//     // status: { //帐户状态， A：正常；B：停用；C：封存
//     //     type: String,
//     //     'enum': ['A', 'B', 'C'],
//     //     default: 'A'
//     // }
// })
// SocialInsuranceAccountPersonalSchema.index({
//     client: 1,
//     account_type: 1,
//     account_no: 1,
// }, {
//     unique: true,
//     dropDups: true
// }); //定义复合索引——唯一键
// module.exports.SocialInsuranceAccountPersonalSchema = SocialInsuranceAccountPersonalSchema;
//个人所得税计算表（平台级）
var IncomeTaxSchema = mongoose.Schema({
    income_name: {
        type: String,
        // required: true
    },
    pri: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItem'
    },
    people_group: { //适用人群，0:所有人,1:中国人 2:外国人，国家规定中国人和外国人的起征点不一样。
        type: String,
        required: true,
        default: 1,
        'enum': ['0', '1', '2'],
    },
    application_type: { //C:普通所得税表;Y:年所得税表
        type: String,
        required: true,
        default: 'C',
        'enum': ['C', 'Y'],
    },
    threshold: {
        type: Number //起征点
    },
    formula: { //当为年终奖时的计算公式
        year_pri: { //年终奖工资项
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayrollItem'
        },
        cardinal_val: Number, //基数
        should_pri: { //税前应发合计
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayrollItem'
        },
    },
    taxrate_table: [{
        level: String, //级数，当前是7级累进税率
        r1: Number, //级数的应税金额下限
        r2: Number, //级数的应税金额上限
        rate: Number, //适用税率
        quick_deduction: Number, //速算扣除数
    }],
})
IncomeTaxSchema.plugin(valid);
// IncomeTaxSchema.index({
//     income_name: 1,
// }, {
//     unique: true,
//     dropDups: true
// }); //定义复合索引——唯一键
module.exports.IncomeTaxSchema = IncomeTaxSchema;
//个人所得税计算表（平台级）
var IncomeTaxClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    income_name: {
        type: String,
        required: true,
    },
    pri: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    },
    people_group: { //适用人群，0:所有人,1:中国人 2:外国人，国家规定中国人和外国人的起征点不一样。
        type: String,
        required: true,
        default: 1,
        'enum': ['0', '1', '2'],
    },
    application_type: { //C:普通所得税表;Y:年所得税表
        type: String,
        required: true,
        default: 'C',
        'enum': ['C', 'Y'],
    },
    threshold: {
        type: Number //起征点
    },
    formula: { //当为年终奖时的计算公式
        year_pri: { //年终奖工资项
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayrollItemClient'
        },
        cardinal_val: Number, //基数
        should_pri: { //税前应发合计
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayrollItemClient'
        },
    },
    taxrate_table: [{
        level: String, //级数，当前是7级累进税率
        r1: Number, //级数的应税金额下限
        r2: Number, //级数的应税金额上限
        rate: Number, //适用税率
        quick_deduction: Number, //速算扣除数
    }],
})
IncomeTaxClientSchema.plugin(valid);
IncomeTaxClientSchema.index({
    client: 1,
    income_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.IncomeTaxClientSchema = IncomeTaxClientSchema;
// IncomeTaxSchema.statics.income_tax = function(period, income_tax_rel) {
//     var self = this;
//     async.waterfall([

//         function(cb) {
//             self.findOne({
//                 validTo: {
//                     '$gt': period
//                 },
//                 validFrom: {
//                     '$lte': period
//                 }
//             }).exec(cb)
//         },
//         function(income_tax, cb) {
//             var obj = {};
//             obj.income_data = 0;
//             var income_tax_num = income_tax_rel - income_tax.threshold;
//             if (income_tax_num > 0) {
//                 var filter_data = us.filter(income_tax.taxrate_table, function(incometax) {
//                     if (income_tax_num > incometax.r1 && income_tax_num <= incometax.r2) {
//                         return incometax;
//                     }
//                 })
//                 obj.income_data = income_tax_num * filter_data[0].rate - filter_data[0].quick_deduction;
//                 obj.Take_home_pay = income_tax_rel - obj.income_data;
//                 cb(null, obj)
//             } else {
//                 obj.Take_home_pay = income_tax_rel;
//                 obj.income_data = 0;
//                 cb(null, obj)

//                 // return obj;
//             }
//         }
//     ], cb)

// }
//平台级别的工资项目－客户可以从平台级的数据库中选择并复制到客户自己的工资项数据库
var PayrollItemSchema = mongoose.Schema({
    pri_code: { //工资项代码，内部程序使用。预置的工资项系统内给出编码，用来做程序的自动识别和计算。
        type: String
    },
    pri_name: { //工资项目名称
        type: String,
        required: true
    },
    pri_descrpt: { //工资项目的说明文字
        type: String,
    },
    pri_category: { //工资项的分组（用于生成计算公式的时候选择）
        type: String,
        'enum': ['1', '2', '3'], //1:明细 2:小计 3: 总计
        default: '1'
    },
    // pri_detail_type: { //明细类型
    //     type: String,
    //     'enum': ['1', '2', '3', '4', '5'], //1:一般工资项 2:应发工资项 3: 个税,4:实发
    //     default: '1'
    // },
    sign: { //符号，用来标示该项目是支付项还是扣减项
        type: String,
        'enum': ['+', '-'],
        required: true,
        default: '+'
    },
    pri_type: { //类型，用来标示该项目的值的来源
        type: String,
        'enum': ['F', 'M', 'C', 'O'], //F:固定值；M:手工直接导入；C:经过计算得出;O:来自其他模块
        required: true,
        default: 'F'
    },
    is_social_insurance_item: Boolean, //是否属于社会保险项目
    is_welfare_item: Boolean, //是否属于工资福利项目
    pris: [{
        pri: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayrollItem'
        },
        sign: {
            type: String,
            'enum': ['+', '-'],
            required: true,
            default: '+'
        }
    }]
})
PayrollItemSchema.plugin(valid);
PayrollItemSchema.index({
    pri_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.PayrollItemSchema = PayrollItemSchema;

//平台级别的工资项目－客户可以从平台级的数据库中选择并复制到客户自己的工资项数据库
var PayrollItemClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    pri_code: { //工资项代码，内部程序使用。预置的工资项系统内给出编码，用来做程序的自动识别和计算。
        type: String
    },
    pri_name: { //工资项目名称
        type: String,
        required: true
    },
    pri_descrpt: { //工资项目的说明文字
        type: String,
    },
    pri_category: { //工资项的分组（用于生成计算公式的时候选择）
        type: String,
        'enum': ['1', '2', '3'], //1:明细 2:小计 3: 总计
        default: '1'
    },
    // pri_detail_type: { //明细类型
    //     type: String,
    //     'enum': ['1', '2', '3', '4', '5'], //1:一般工资项 2:应发工资项 3: 个税,4:实发
    //     default: '1'
    // },
    sign: { //符号，用来标示该项目是支付项还是扣减项
        type: String,
        'enum': ['+', '-'],
        required: true,
        default: '+'
    },
    pri_type: { //类型，用来标示该项目的值的来源
        type: String,
        'enum': ['F', 'M', 'C', 'O'], //F:固定值；M:手工直接导入；C:经过计算得出;O:来自其他模块
        required: true,
        default: 'F'
    },
    is_social_insurance_item: Boolean, //是否属于社会保险项目
    is_welfare_item: Boolean, //是否属于工资福利项目
    pris: [{
        pri: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayrollItemClient'
        },
        sign: {
            type: String,
            'enum': ['+', '-'],
            required: true,
            default: '+'
        }
    }]
})
PayrollItemClientSchema.plugin(valid);
PayrollItemClientSchema.index({
    client: 1,
    pri_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.PayrollItemClientSchema = PayrollItemClientSchema;

//工资方案，一个client可以有多套方案
var PayrollPackageSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    pp_code: { //工资方案代码，用于快速输入
        type: String,
        required: true,
    },
    pp_name: { //工资方案名称(内容)
        type: String,
        required: true,
    },
    pp_descrpt: {
        type: String,
    },
    pris: [{ //包含的工资项
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    }],
    //应用范围，按照不同的优先级来确定最终应用到个人身上的方案
    job_sequences: [{ //职务序列 优先级：0
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobSequence'
    }],
    esgs: [{ //员工子组 － 对应people中的esg 优先级：1
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeSubGroup'
    }],
    companies: [{ //公司代码 优先级：2
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }],
    ous: [{ //组织单元 优先级：3
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit'
    }],
    positions: [{ //职位 优先级：4
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    }],

})
PayrollPackageSchema.plugin(valid);
PayrollPackageSchema.index({
    client: 1,
    pp_code: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.PayrollPackageSchema = PayrollPackageSchema;

//工资方案适用组
var PayrollPackageConditionGroupSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    pg_name: {
        type: String,
        required: true,
    },
    payroll_package: { //适用的工资方案
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollPackage'
    },
    payroll_packages: [{ //适用的工资方案
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollPackage'
    }],
    //应用范围，按照不同的优先级来确定最终应用到个人身上的方案
    job_sequences: [{ //职务序列 优先级：0
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobSequence'
    }],
    esgs: [{ //员工子组 － 对应people中的esg 优先级：1
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeSubGroup'
    }],
    companies: [{ //公司代码 优先级：2
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }],
    ous: [{ //组织单元 优先级：3
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit'
    }],
    positions: [{ //职位 优先级：4
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    }],
})
PayrollPackageConditionGroupSchema.plugin(valid);
PayrollPackageConditionGroupSchema.index({
    client: 1,
    pg_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.PayrollPackageConditionGroupSchema = PayrollPackageConditionGroupSchema;


// 计算公式-一个工资方案可以对应多个计算公式
var PayrollProcedureSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },

    procedure: [ //过程
        {
            step: { //步骤
                type: Number,
                // 'enum': ['1', '2', '3', '4', '5', ], //1:应发工资 2:税前列支福利 3:所得税 4:税后应加应扣 5:实发工资
            },
            operand: { //操作数（加减项通过pri的符号sign来判断）
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PayrollItemClient',
            },
            sign: {
                type: String,
                // 'enum': ['+', '-', '=', ''],
            }

        },
    ],
    result: { //步骤计算结果
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient',
    },
})

module.exports.PayrollProcedureSchema = PayrollProcedureSchema;
// 计件工资费率表
var PieceworkRateSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    pri: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    },
    pr_name: {
        type: String,
        required: true,
    },
    gua_value: { //保底值
        type: String,
        required: true,
    },
    cap_value: { //封顶值
        type: String,
        required: true,
    },
    subsection: [{ //不同段所对应的费率
        r1: { //下限－闭区间(默认0)
            type: Number,
            default: 0
        },
        r2: { //上限－开区间(默认无穷大)
            type: Number,
            default: Infinity
        },
        a: Number, // 单位费率
        // b: Number, // 直接加减
    }],
    positions: [{ //适用职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    }],
    people: [{ //适用人员
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    }],
});
PieceworkRateSchema.plugin(valid);
PieceworkRateSchema.index({ //费率名称唯一控制
    client: 1,
    pr_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.PieceworkRateSchema = PieceworkRateSchema;
//计件工资－数据表
//计算时根据期间和人来查出件数以及单价，相乘并求和后作为计件工资项的金额。
var PieceworkWagesSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    pri: { //对应的工资项
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    },
    people: { //人员
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    start: Date, //开始日期
    end: Date, //结束日期
    pieces: { //件数
        type: Number,
    },
    pr: { //计件工资费率
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PieceworkRate'
    },
    comment: String //备注，可用来标注工作内容、导入日期等额外信息
});
module.exports.PieceworkWagesSchema = PieceworkWagesSchema;

// 提成工资费率表
var DeductionRateSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    pri: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    },
    pr_name: {
        type: String,
        required: true,
    },
    gua_value: { //保底值
        type: String,
        required: true,
    },
    cap_value: { //封顶值
        type: String,
        required: true,
    },
    subsection: [{ //不同段所对应的费率
        r1: { //下限－闭区间(默认0)
            type: Number,
            default: 0
        },
        r2: { //上限－开区间(默认无穷大)
            type: Number,
            default: Infinity
        },
        a: Number, // 单位费率
        // b: Number, // 直接加减
    }],
    positions: [{ //适用职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    }],
    people: [{ //适用人员
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    }],
});
DeductionRateSchema.plugin(valid);
DeductionRateSchema.index({ //费率名称唯一控制
    client: 1,
    pr_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.DeductionRateSchema = DeductionRateSchema;
//提成工资－数据表
//计算时根据期间和人来查出件数以及单价，相乘并求和后作为提成工资项的金额。
var DeductionWagesSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    pri: { //对应的工资项
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    },
    people: { //人员
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    start: Date, //开始日期
    end: Date, //结束日期
    pieces: { //件数
        type: Number,
    },
    pr: { //计件工资费率
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeductionRate'
    },
    comment: String //备注，可用来标注工作内容、导入日期等额外信息
});
module.exports.DeductionWagesSchema = DeductionWagesSchema;
// 人员工资信息表－抬头
var PayrollPeopleSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: { //人员
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    payroll_package: { //适用的工资方案
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollPackage'
    },
    payroll_procedure: { //适用的计算公式
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollProcedure'
    },
    pay_start: Date, //工资计算开始日期－开始日期
    pay_end: Date, //工资计算结束日期－结束日期
    items: [ //工资项的来源
        {
            pri: { //工资项
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PayrollItemClient'
            },
            source_type: { //数据来源
                type: String,
                'enum': ['F', 'M', 'C'], //F:固定值；M:手工直接导入；C:经过计算得出
                default: 'F'
            },
            value: Number, //对于固定值，直接在这里给出
        },
    ]
});
PayrollPeopleSchema.plugin(valid);
PayrollPeopleSchema.index({ //一个人员只能有一个工资计算方案和公式
    client: 1,
    people: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.PayrollPeopleSchema = PayrollPeopleSchema;
// 系统内人员工资单
var PayrollPeopleInstanceSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    pay_start: Date, //工资核算的期间－开始日期
    pay_end: Date, //工资核算的期间－结束日期
    items: [ //工资项
        {
            pri: { //工资项
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PayrollItemClient'
            },
            amount: Number, //金额
        },
    ],
    // company_welfare: [{
    //     pri: { //工资项
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'PayrollItemClient'
    //     },
    //     amount: Number, //公司需缴纳的福利项
    // }],
    // should_pay: Number, //应发工资
    // income_tax: Number, //所得税
    // real_pay: Number, //实发工资
});
PayrollPeopleInstanceSchema.plugin(valid);
module.exports.PayrollPeopleInstanceSchema = PayrollPeopleInstanceSchema;

var PayrollPeopleInstanceReportSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    company_name: {
        type: String,
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    ou_name: {
        type: String
    },
    ou: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit'
    },
    position_name: {
        type: String
    },
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position',
    },
    jobrank: { //职位等级
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobRank',
    },
    joblevel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobLevel',
    },
    pay_month: {
        type: Number
    },
    payroll_people_instance: { //薪酬实例
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollPeopleInstance',
    },
});
module.exports.PayrollPeopleInstanceReportSchema = PayrollPeopleInstanceReportSchema;



// 系统外人员薪酬计算
// 参与薪酬计算的系统外人员工资单
var PayrollNoStaffInstanceSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people_name: { //人员姓名
        type: String,
        required: true,
    },
    pay_start: Date, //工资核算的期间－开始日期
    pay_end: Date, //工资核算的期间－结束日期
    amount: Number, //支付的金额
});
module.exports.PayrollNoStaffInstanceSchema = PayrollNoStaffInstanceSchema;
// 薪酬模块配置
var PayrollConfigSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    work_hours: { //每月的标准工作小时数(2013最新标准：(365-52*2)/12=21.75, 21.75*8=174
        type: Number,
        default: 174
    },
    pris: [{ //计算平均小时工资所包含的工资项
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    }],
    pay_start_date: { //工资核算的期间－开始日期(默认为每月1日)
        type: String,
        default: 1
    },

})
module.exports.PayrollConfigSchema = PayrollConfigSchema;


// 薪酬计划使用
// 薪酬带宽
var RemunerationBandwidthSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    rb_code: { //薪酬带宽代码，用于快速输入
        type: String,
    },
    rb_name: { //薪酬带宽名称(内容)
        type: String,
        required: true,
    },
});

RemunerationBandwidthSchema.plugin(valid);

module.exports.RemunerationBandwidthSchema = RemunerationBandwidthSchema;


//考勤数据收集
var AttendanceDataCollectionSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    data: [ //考勤数据
        {
            pri: { //工资项
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PayrollItemClient'
            },
            radix: Number, //计算基数
            // amount: Number, //金额
            time: Number //时间(小时)
        },
    ],
    pay_start: Date, //工资核算的期间－开始日期
    pay_end: Date, //工资核算的期间－结束日期

})
AttendanceDataCollectionSchema.plugin(valid);
AttendanceDataCollectionSchema.index({
    client: 1,
    people: 1,
    pay_start: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.AttendanceDataCollectionSchema = AttendanceDataCollectionSchema;

//假期数据收集
var HolidayDataCollectionSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    pri: { //工资项
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    },
    data: [ //假期数据
        {
            // pri: { //工资项
            //     type: mongoose.Schema.Types.ObjectId,
            //     ref: 'PayrollItemClient'
            // },
            //假期类型
            absence_type: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AbsenceType'
            },
            rate: Number, //扣款费率
            radix: Number, //扣款基数
            time: Number, //休假时长
            // amount: Number, //金额
        },
    ],
    pay_start: Date, //工资核算的期间－开始日期
    pay_end: Date, //工资核算的期间－结束日期

})
HolidayDataCollectionSchema.plugin(valid);
HolidayDataCollectionSchema.index({
    client: 1,
    people: 1,
    pay_start: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.HolidayDataCollectionSchema = HolidayDataCollectionSchema;

// 薪资调整流程的数据表单－单人
var PYAdjustSingleSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: { //待晋升人员－HR启动流程时选择  people
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    adds: [{ //薪酬调整项
        pic: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayrollItemClient'
        },
        current_value: Number, //原值
        ratio_value: Number, //百分比值
        add_value: Number, //加多少
        new_value: Number //加后的值
    }],
    // subs: [{ //减项
    //     pic: { //工资项
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'PayrollItemClient'
    //     },
    //     current_value: Number, //原值
    //     ratio_value: Number,
    //     sub_value: Number, //加多少
    //     new_value: String //加后的值
    // }],
    effective_date: String, //生效日期
    position_payroll: {
        min: Number,
        max: Number,
        average: Number
    },
    flowisover: { //流程是否结束
        type: Boolean,
        default: false
    },
    applied: { //是否被后台程序处理过并确实生效
        type: Boolean,
        default: false
    }
})
PYAdjustSingleSchema.plugin(valid); //开始日期对应调整后开始生效的日期，结束日期默认为9999-12-31
module.exports.PYAdjustSingleSchema = PYAdjustSingleSchema;

// 薪资调整流程的数据表单－多人批量
var PYAdjustBulkSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    peoples: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    }],
    checked_val: String, //P:按照工资项算,F:按照固定值算
    fixed_value: Number, //按照固定值算
    pri_value: { //按照工资项算的工资项及值
        pri: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayrollItemClient'
        },
        ratio_value: Number
    },
    items: [{ //按照工资项算，每个人应调薪多少钱
        people: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'People'
        },
        value: Number //每个人要加多少
    }],

    last_items: [{ //要调整的项目项，
        pic: { //工资项
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayrollItemClient'
        },
        ratio_value: Number,
    }],
    low_val: Number,
    hight_val: Number,
    total_val: Number,
    effective_date: String, //生效日期
    flowisover: { //流程是否结束
        type: Boolean,
        default: false
    },
    applied: { //是否被后台程序处理过并确实生效
        type: Boolean,
        default: false
    }
})
PYAdjustBulkSchema.plugin(valid); //开始日期对应调整后开始生效的日期，结束日期默认为9999-12-31
module.exports.PYAdjustBulkSchema = PYAdjustBulkSchema;

// 工资数据报表提交审核流程－通过公司代码
var CompanyPayrollVerifySchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    company: { //  根据公司代码来生成人员数据报表提交审核流程
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    people_payroll: [{ //人员工资单
        people: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'People'
        },
        items: [ //假期数据
            {
                pri: { //工资项
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'PayrollItemClient'
                },
                amount: Number, //金额
            },
        ]
    }],
    month_date: String, //审批那月数据
    flowisover: { //流程是否结束
        type: Boolean,
        default: false
    },
})
CompanyPayrollVerifySchema.plugin(valid); //开始日期对应调整后开始生效的日期，结束日期默认为9999-12-31
module.exports.CompanyPayrollVerifySchema = CompanyPayrollVerifySchema;

//行政扣款数据
var AdministrativeDeductionDataCollectionSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    data: [ //假期数据
        {
            pri: { //工资项
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PayrollItemClient'
            },
            amount: Number, //金额
            reason: String //原因
        },
    ],
    pay_start: Date, //工资核算的期间－开始日期
    pay_end: Date, //工资核算的期间－结束日期

})
AdministrativeDeductionDataCollectionSchema.plugin(valid);
AdministrativeDeductionDataCollectionSchema.index({
    client: 1,
    people: 1,
    pay_start: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.AdministrativeDeductionDataCollectionSchema = AdministrativeDeductionDataCollectionSchema;

//最低工资设置( 平台)
var MinimumWageSchema = mongoose.Schema({
    nation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Nation'
    },
    province: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Province'
    },
    // category: {
    //     type: String,
    //     'enum': ['1', '2', '3', '4'], //'1':一类地区  '2':二类地区 '3':三类地区 '4':四类地区
    //     default: '1'
    // },
    // creterion_month: Number, //月最低工资标准
    // creterion_hour: Number, //小时最低工资标准
    data: [{
        category: {
            type: String,
            'enum': ['1', '2', '3', '4'], //'1':一类地区  '2':二类地区 '3':三类地区 '4':四类地区
            default: '1'
        },
        creterion_month: Number, //月最低工资标准
        creterion_hour: Number, //小时最低工资标准
    }]
})
MinimumWageSchema.plugin(valid);
module.exports.MinimumWageSchema = MinimumWageSchema;

//最低工资设置( 客户)
var MinimumWageClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    nation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Nation'
    },
    province: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Province'
    },
    // category: {
    //     type: String,
    //     'enum': ['1', '2', '3', '4'], //'1':一类地区  '2':二类地区 '3':三类地区 '4':四类地区
    //     default: '1'
    // },
    // creterion_month: Number, //月最低工资标准
    // creterion_hour: Number, //小时最低工资标准
    data: [{
        category: {
            type: String,
            'enum': ['1', '2', '3', '4'], //'1':一类地区  '2':二类地区 '3':三类地区 '4':四类地区
            default: '1'
        },
        creterion_month: Number, //月最低工资标准
        creterion_hour: Number, //小时最低工资标准
    }]
})
MinimumWageClientSchema.plugin(valid);
module.exports.MinimumWageClientSchema = MinimumWageClientSchema;
//假期考勤基数配置
var HolidayCardinalitySchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    category: {
        type: String,
        enum: ['1', '2', '3', '4'], //'1':缺勤  '2':正常工作日加班 '3':休息日加班 '4':法定节假日加班
        default: '1'
    },
    rate: {
        type: Number,
        default: '1'
    },
    pri: { //对应的工资项
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    },
    company: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }],
    pris: [{
        pri: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayrollItemClient'
        },
        sign: {
            type: String,
            'enum': ['+', '-'],
            required: true,
            default: '+'
        }
    }]

})
HolidayCardinalitySchema.plugin(valid);
module.exports.HolidayCardinalitySchema = HolidayCardinalitySchema;
var ReportOrderConfigSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    payrolls_order: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    }],
})
module.exports.ReportOrderConfigSchema = ReportOrderConfigSchema;

var ReportCompanyCostConfigSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },

    report_name: { //自定义报表名称
        type: String,
        required: true,
    },
    report_desc: { //自定义报表描述
        type: String,
    },
    payrolls: [{
        pri: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayrollItemClient'
        },
        sign: {
            type: String,
            'enum': ['+', '-'],
            required: true,
            default: '+'
        }
    }],
})
module.exports.ReportCompanyCostConfigSchema = ReportCompanyCostConfigSchema;
//薪酬等级

var PayrollGradeSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    grade_name: { //等级名称
        type: String,
        required: true
    },
    company: [{ //适用公司
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }],
    //废弃
    // jobsequence: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'JobSequence'
    // },
    grade_amount: {
        type: Number,
        required: true
    },
    grade_data: [{ //等级数据,多对多的关系
        grade_num: {
            type: Number,
            required: true
        },
        pri: [{
            pri_item: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PayrollItemClient'
            },
            value: {
                type: Number,
                default: 0
            }
        }]

    }]

})
module.exports.PayrollGradeSchema = PayrollGradeSchema;
//外部导入数据收集
var ImportDataCollectionSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    pri: { //工资项
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    },
    amount: Number, //金额
    pay_start: Date, //工资核算的期间－开始日期
    pay_end: Date, //工资核算的期间－结束日期


})
ImportDataCollectionSchema.plugin(valid);
module.exports.ImportDataCollectionSchema = ImportDataCollectionSchema;
