# 企业工作流系统 - 设计系统

> 源文件路径: `/Users/a1234/Desktop/工作流/.stitch/DESIGN.md`

## 设计理念

**视觉方向**: 企业级深色科技风格 + 扁平化卡片设计
**关键词**: 专业、高效、可信赖、现代企业数字化
**氛围**: 深色背景搭配渐变蓝色强调色，传达科技感和专业性

---

## 色彩系统

### 主色板 (Primary Palette)

| 名称 | 色值 | 用途 |
|------|------|------|
| Primary | `#3B82F6` | 主按钮、主要链接、焦点状态 |
| Primary Hover | `#2563EB` | 按钮悬停态 |
| Primary Light | `#60A5FA` | 次要强调、图标 |

### 辅助色板 (Secondary Palette)

| 名称 | 色值 | 用途 |
|------|------|------|
| Secondary | `#8B5CF6` | 次要操作、辅助信息 |
| Accent | `#06B6D4` | 特别强调、徽章 |

### 状态色板 (Status Palette)

| 名称 | 色值 | 用途 |
|------|------|------|
| Success | `#10B981` | 已完成状态、确认成功 |
| Warning | `#F59E0B` | 紧急状态、待处理 |
| Danger | `#EF4444` | 重大事件、错误提示、驳回 |
| Info | `#6366F1` | 重大事件标签 |

### 背景色板 (Background Palette)

| 名称 | 色值 | 用途 |
|------|------|------|
| BG Base | `#0F172A` | 页面最底层背景 |
| BG Card | `#1E293B` | 卡片背景 |
| BG Elevated | `#334155` | 悬浮元素、模态框 |
| BG Input | `#0F172A` | 输入框背景 |

### 文字色板 (Text Palette)

| 名称 | 色值 | 用途 |
|------|------|------|
| Text Primary | `#F8FAFC` | 主标题、重要文字 |
| Text Secondary | `#94A3B8` | 次要文字、描述 |
| Text Muted | `#64748B` | 禁用文字、时间戳 |

### 边框色板 (Border Palette)

| 名称 | 色值 | 用途 |
|------|------|------|
| Border | `#334155` | 默认边框 |
| Border Focus | `#3B82F6` | 焦点边框 |

---

## 圆角系统 (Border Radius)

| 名称 | 值 | 用途 |
|------|------|------|
| Radius SM | `4px` | 小标签、徽章 |
| Radius MD | `8px` | 输入框、小按钮 |
| Radius LG | `12px` | 卡片、面板 |
| Radius XL | `16px` | 大卡片、模态框 |
| Radius Full | `9999px` | 圆形头像、全宽按钮 |

---

## 阴影系统 (Shadow)

| 名称 | 值 | 用途 |
|------|------|------|
| Shadow SM | `0 1px 2px rgba(0,0,0,0.3)` | 小元素 |
| Shadow MD | `0 4px 6px rgba(0,0,0,0.4)` | 卡片悬浮 |
| Shadow LG | `0 10px 15px rgba(0,0,0,0.5)` | 模态框、弹出层 |

---

## 字体系统

### 字体族 (Font Family)

```css
--font-sans: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 字号系统 (Font Size)

| 名称 | 值 | 用途 |
|------|------|------|
| Text XS | `12px` | 时间戳、标签 |
| Text SM | `14px` | 正文、次要文字 |
| Text Base | `16px` | 基础文字 |
| Text LG | `18px` | 卡片标题 |
| Text XL | `20px` | 区块标题 |
| Text 2XL | `24px` | 页面副标题 |
| Text 3XL | `30px` | 页面主标题 |

### 字重系统 (Font Weight)

| 名称 | 值 | 用途 |
|------|------|------|
| Font Normal | `400` | 正文 |
| Font Medium | `500` | 次要强调 |
| Font Semibold | `600` | 按钮文字、标题 |
| Font Bold | `700` | 大标题、徽章 |

---

## 间距系统 (Spacing)

| 名称 | 值 | 用途 |
|------|------|------|
| Space 1 | `4px` | 紧凑间距 |
| Space 2 | `8px` | 小元素间距 |
| Space 3 | `12px` | 默认间距 |
| Space 4 | `16px` | 卡片内边距 |
| Space 6 | `24px` | 区块间距 |
| Space 8 | `32px` | 大区块间距 |

---

## 动画系统

### 时长 (Duration)

| 名称 | 值 | 用途 |
|------|------|------|
| Duration Fast | `150ms` | 微交互、状态切换 |
| Duration Normal | `300ms` | 默认过渡 |
| Duration Slow | `500ms` | 大型动画 |

### 缓动 (Easing)

| 名称 | 值 | 用途 |
|------|------|------|
| Ease Out | `cubic-bezier(0.16, 1, 0.3, 1)` | 强调输出动画 |
| Ease In Out | `cubic-bezier(0.4, 0, 0.2, 1)` | 默认过渡 |
| Spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 弹性动画 |

---

## 组件规范

### 按钮 (Button)

#### 主要按钮
- 背景: Primary `#3B82F6`
- 文字: `#FFFFFF`
- 圆角: `Radius Full`
- 高度: `44px`
- 字号: `Text Base` `600`
- 悬浮: 背景变深 + 上移 `2px` + 阴影增强

#### 次要按钮
- 背景: `transparent`
- 边框: `1px solid Border`
- 文字: `Text Primary`
- 悬浮: 背景 `BG Elevated`

#### 危险按钮
- 背景: `Danger` `#EF4444`
- 用于: 驳回、删除等危险操作

#### 图标按钮
- 尺寸: `40px × 40px`
- 圆角: `Radius MD`
- 背景: `BG Card`
- 悬浮: 背景 `BG Elevated`

### 输入框 (Input)

- 背景: `BG Input`
- 边框: `1px solid Border`
- 圆角: `Radius MD`
- 高度: `44px`
- 聚焦: 边框变 Primary + 阴影
- 占位符: `Text Muted`

### 卡片 (Card)

- 背景: `BG Card`
- 边框: `1px solid Border`
- 圆角: `Radius LG`
- 内边距: `Space 4`
- 悬浮: 上移 `4px` + 阴影增强

### 标签 (Badge)

#### 状态标签
- Pending: 边框 `#64748B` + 文字 `#94A3B8`
- Processing: 边框 `#3B82F6` + 文字 `#60A5FA`
- Completed: 边框 `#10B981` + 文字 `#34D399`
- Rejected: 边框 `#EF4444` + 文字 `#F87171`
- Critical: 边框 `#EF4444` + 背景 `rgba(239,68,68,0.1)`

#### 类型标签
- 普通: 背景 `#334155`
- 紧急: 背景 `rgba(245,158,11,0.15)` + 文字 `#F59E0B`
- 重大: 背景 `rgba(239,68,68,0.15)` + 文字 `#EF4444`

### 拓扑图节点 (Topology Node)

#### 节点样式
- 形状: 圆角矩形 `Radius XL`
- 尺寸: `120px × 60px`
- 完成状态: 边框 `#10B981` + 背景 `rgba(16,185,129,0.1)`
- 当前状态: 边框 `#3B82F6` + 背景 `rgba(59,130,246,0.1)` + 脉冲动画
- 待处理: 边框 `#334155` + 背景 `BG Card`

#### 连接线
- 颜色: 渐变从源节点颜色到目标节点颜色
- 宽度: `2px`
- 已完成: 实线
- 待处理: 虚线 `4px 4px`

---

## 浅色主题变量覆盖

```css
[data-theme="light"] {
  --bg-base: #F8FAFC;
  --bg-card: #FFFFFF;
  --bg-elevated: #F1F5F9;
  --bg-input: #FFFFFF;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --border: #E2E8F0;
  --shadow: rgba(0,0,0,0.1);
}
```
