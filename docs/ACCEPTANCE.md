# 23 个模块对照验收

运行 `npm run build && node scripts/build-acceptance.mjs`。输出到隔离目录 `_acceptance/`；GitHub Pages 工作流仅发布此目录。`index.html` 供本地静态服务器读取；`offline.html` 将 JS、CSS、所有官方截图内嵌，可直接用 file:// 打开。图片模块的本地 SVG 单独保存在 assets/。因卡片生产安全策略只允许 HTTP(S) 图片，直接 file:// 打开时图片模块明确显示限制；本地 HTTP 预览正常使用同源 SVG。本页没有放宽此安全限制。

不加载 Mushroom bundle，不连接 HA，不调用外部字体。

## 比较边界

- 左侧是 Mushroom v5.2.3 原仓库的静态官方截图，不是本次同实体、同状态运行截图，不能由此证明 Mushroom 交互等价。
- 新 Template 源为 `docs/images/template-light.png`，不是 `legacy-template-light.png`。
- 组合类仅展示一个基础组件官方样例，并明确不是完整组合、不是专用家电卡。
- picture 没有等价 Mushroom 大图卡，因此显示说明而不是错误图片；spacer 没有截图，显示 Empty 类型说明，不伪装成实际渲染。
- 右侧使用真实 `island-*-card` 自定义元素和 Animal Island UI 3.0.0 组件。
- 页面框架使用包根导出的 Title（ribbon）、Card、Select、Button；样式来自 `dist/animal-island.css`，移除 font-face。字体采用系统回退，与官方字体的字形度量可能不同。
- 完整映射及固定版来源保存在 `demo/acceptance-mapping.json`，构建后复制为 `mapping-23.json`。

## 23 项名称映射

|本项目 profile|Mushroom 参考|对应方式|
|---|---|---|
|chips|Chips|直接组件|
|summary（基线 room）|Template + Chips|组合建议，仅显示 Template 官方样例|
|light|Light|直接组件|
|climate|Climate|直接组件|
|cover|Cover|直接组件|
|fan|Fan|直接组件|
|media|Media Player|直接组件|
|vacuum|Vacuum|直接组件|
|entity|Entity|直接组件|
|scene|Entity / Template|通用组件配置|
|number|Number|直接组件|
|select|Select|直接组件|
|laundry（基线 washer）|Template + Entity|组合建议|
|fridge|Entity|组合建议|
|water（基线 purifier）|Template + Entity|组合建议|
|feeder|Template + Number + Action Chip|组合建议|
|meal（基线 foodlog）|Template|通用组件配置|
|printer|Template + Entity + Action Chips|组合建议|
|consumable|Entity / Template|通用组件配置|
|camera|Entity|仅相机详情入口对应，无专用视频卡|
|health（基线 system）|Entity|组合建议|
|picture（基线 image）|无直接等价|明确缺失，不展示错误截图|
|spacer|Empty|类型说明，无官方截图|

## 模拟验收步骤

1. 默认显示所有 23 行。家族与模块筛选可组合；若无交集给出空态。
2. 默认、关闭/完成、暂停会重置模拟种子，然后改变适用设备；不把只读数值传感器强行改成“off”。
3. 不可用使所有模拟实体 unavailable；只读通过各卡的 read_only 配置禁用写操作。
4. “操作失败”需点击操作后才显示失败；“等待响应”在操作后挂起 Promise，通过“释放待响应操作”完成。
5. 重置会拒绝未完成模拟请求，清空调用记录，恢复默认状态。
6. 每次状态写入推送所有已挂载卡片。切换筛选后新挂载模块继承当前模拟状态。
7. 服务记录仅本地保存，最多在页面展示最近20次；详情入口依赖卡片原行为，不伪造真实 HA 详情面板。
8. 桌面行使用两个等宽容器；700px 以下按左、右顺序堆叠，目标宽度390px。

## 验证记录

GitHub CI 负责真正 Chromium 渲染、桌面/390px/320px 布局、键盘焦点、编辑器、状态与精确模拟服务回归。每次验收 CI 上传真实页面截图及独立静态预览文件。具体通过/失败数量以该提交的 CI 结果为准；静态检查或构建成功不代表浏览器验证或用户视觉验收。

没有真实 Home Assistant 设备或官方 Mushroom 同状态运行时验证。官方参考图与右侧模拟状态差异已在每行标注。
