# 流程图插件重构迁移说明

## 🎉 重构完成

flowchart库已成功重构为monorepo架构，支持多框架。

## 📁 新的目录结构

```
libraries/flowchart/
├── packages/
│   ├── core/           # 核心引擎（独立于框架）
│   ├── lit/            # Lit Web Components适配器
│   ├── react/          # React组件适配器
│   └── vue/            # Vue组件适配器
├── examples/           # 综合示例
└── src/ (已废弃)       # 旧代码，可以删除
```

## 🚀 构建说明

所有包现在都使用 `@ldesign/builder` 进行构建：

```bash
# 构建所有包
pnpm build

# 构建单个包
pnpm --filter @ldesign/flowchart-core build
pnpm --filter @ldesign/flowchart-react build
pnpm --filter @ldesign/flowchart-vue build
pnpm --filter @ldesign/flowchart-lit build
```

## 🎨 运行演示

```bash
# React演示
cd packages/react/demo && pnpm dev  # http://localhost:3001

# Vue演示  
cd packages/vue/demo && pnpm dev    # http://localhost:3002

# Lit演示
cd packages/lit/demo && pnpm dev    # http://localhost:3003
```

## ⚠️ 废弃说明

- 旧的`src/`目录已不再使用，所有代码已迁移到`packages/core/src/`
- 旧的打包配置已替换为`ldesign.config.ts`
- 使用`@ldesign/builder`替代了`vite`和自定义rollup配置

## 🔄 迁移步骤

如果您正在维护此项目：

1. ✅ 所有包已配置`ldesign.config.ts`
2. ✅ 所有包已更新为使用`ldesign-builder`
3. ✅ 演示项目已配置完成
4. ⏳ 可以安全删除`src/`目录
5. ⏳ 可以删除`vite.config.ts`和`rollup.config.js`（如果存在）

## 📦 产物目录

- **core, react, vue**: `es/` (ESM) + `lib/` (CommonJS)
- **lit**: `es/` (仅ESM，Web Components标准)

## 🎯 下一步

1. 删除旧的`src/`目录
2. 运行`pnpm install`安装依赖
3. 运行`pnpm build`构建所有包
4. 运行各个demo测试功能
