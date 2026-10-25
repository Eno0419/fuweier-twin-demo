# 浅色工业工作台 · 2026-10-25

用户选择：灰白面板、清晰数据、三维场景居中。

## 获奖参考与采用方式

- **AIOT Smart Park**，Red Dot Brands & Communication Design 2023。借鉴园区三维空间与业务模块并置、空间对象作为操作入口的方式。官方项目：[Red Dot](https://www.red-dot.org/project/aiot-smart-park-66697)。
- **Blue HMI**，Red Dot Brands & Communication Design 2025，Minebea Intec / HMI Project。借鉴浅底深字、大数字、稳定操作区和状态色语义。官方项目：[Red Dot](https://www.red-dot.org/project/blue-hmi-85123)；设计方案例：[HMI Project](https://hmi-project.com/en/projects/minebea-intec)。

上述是参考项目的奖项，本 DEMO 没有获奖。界面自行实现，不复制参考项目的图片或品牌资产。

## 本站应用

- 白色导航及业务面板，雾灰三维背景，蓝色表示操作与选中，琥珀色表示待处理异常。
- 厂区总览、重点产线、安防页底部压缩为 112px，将更多高度交给场景；工艺、趋势、追溯保留 190px 业务区域。
- 主设备字段、测点表、关联设备、告警、流程图、趋势和弹窗采用同一浅色视觉规则。
- 建筑标签缩短次要文字，重点塔楼保留可分层提示；场景工具在标签上方，避免标签遮挡导航操作。
- 梁柱楼板使用不同深度的蓝灰色，增加浅色环境中的结构辨识；继续使用对数深度缓冲。
- 232 条设备、533 条测点及来源保持原表口径；演示数据和未接入提示保留。

主题样式位于 `src/workbench.css`，基础布局与交互样式位于 `src/styles.css`。后续组件需同时检查浅色对比度及状态色语义。
