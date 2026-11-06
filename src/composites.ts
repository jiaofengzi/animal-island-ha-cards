import type {Kind} from './core';
export interface FieldRole {name:string;unit?:string;progress?:boolean}
export const compositeSchemas:Partial<Record<Kind,{description:string;roles:Record<string,FieldRole>}>>={
 laundry:{description:'洗衣或烘干的运行状态、进度与剩余时间；控制由配置的集成动作提供。',roles:{status:{name:'运行状态'},progress:{name:'完成进度',unit:'%',progress:true},remaining:{name:'剩余时间'},program:{name:'当前程序'}}},
 fridge:{description:'冷藏与冷冻温度、门状态；不会自动修改温度或推断食物安全。',roles:{temperature:{name:'冷藏温度'},freezer:{name:'冷冻温度'},door:{name:'门状态'},power:{name:'功率'}}},
 water:{description:'显示集成提供的水质读数、滤芯寿命和流量；不作饮用安全判断。',roles:{tds:{name:'出水 TDS'},filter:{name:'滤芯剩余',unit:'%',progress:true},flow:{name:'流量'},status:{name:'状态'}}},
 feeder:{description:'余粮、份量与上次投喂信息；每次投喂动作都需确认。',roles:{remaining:{name:'余粮'},portion:{name:'份量'},last_feed:{name:'上次投喂'},status:{name:'状态'}}},
 meal:{description:'只展示集成提供的最近餐盘记录；不采集照片、不写入记录、不提供历史数据库。',roles:{record:{name:'最近餐盘记录'},recorded_at:{name:'记录时间'},note:{name:'备注'}}},
 printer:{description:'打印任务、进度和温度；暂停、取消等动作由所选集成提供并确认。',roles:{status:{name:'打印状态'},progress:{name:'完成进度',unit:'%',progress:true},nozzle:{name:'喷嘴温度'},bed:{name:'热床温度'},remaining:{name:'剩余时间'}}},
 consumable:{description:'显示集成计算的余量或寿命；本卡片不自动复位计数器。',roles:{remaining:{name:'剩余量'},life:{name:'剩余寿命',unit:'%',progress:true},replacement:{name:'更换时间'}}},
 health:{description:'展示已有诊断传感器；不主动扫描设备或执行自动修复。',roles:{status:{name:'健康状态'},cpu:{name:'CPU 使用率',unit:'%',progress:true},memory:{name:'内存使用率',unit:'%',progress:true},disk:{name:'磁盘剩余'},temperature:{name:'温度'},uptime:{name:'运行时间'}}}
};
