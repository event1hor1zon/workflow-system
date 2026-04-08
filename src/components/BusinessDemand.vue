<template>
  <div class="demand-container">
    <!-- 列表页头部（始终显示） -->
    <div class="demand-header">
      <ThemeToggle />
      <button class="back-btn" @click="$router.push('/')">← 返回全景图</button>
      <div class="header-title">
        <span class="title-icon">📋</span>
        <span class="title-text">业务需求工单流转系统</span>
      </div>
      <div class="header-subtitle">中国移动包头分公司 · 网络条线握手协同</div>
    </div>

    <!-- 标签导航 -->
    <div class="tab-nav">
      <button :class="['tab-btn', {active: activeTab === 'new'}]" @click="activeTab = 'new'">
        ✨ 新建需求<span class="tab-count" v-if="newOrders.length">{{newOrders.length}}</span>
      </button>
      <button :class="['tab-btn', {active: activeTab === 'draft'}]" @click="activeTab = 'draft'">
        📝 草稿待流转<span class="tab-count" v-if="draftOrders.length">{{draftOrders.length}}</span>
      </button>
      <button :class="['tab-btn', {active: activeTab === 'flowing'}]" @click="activeTab = 'flowing'">
        🔄 正在流转<span class="tab-count flowing" v-if="flowingOrders.length">{{flowingOrders.length}}</span>
      </button>
    </div>

    <!-- 列表内容 -->
    <div class="order-list">
      <!-- 新建 -->
      <div v-if="activeTab === 'new'" class="order-grid">
        <div class="order-card" v-for="order in newOrders" :key="order.id" @click="goToOrder(order)">
          <div class="card-header">
            <span class="order-id">{{order.id}}</span>
            <span class="order-status new">新建</span>
          </div>
          <div class="card-title">{{order.title}}</div>
          <div class="card-info">
            <div>发起人：{{order.creator}}</div>
            <div>部门：{{order.dept}}</div>
            <div>类型：{{order.type}}</div>
          </div>
          <div class="card-footer">创建于 {{order.createTime}}</div>
        </div>
        <div class="order-card add-card" @click="showNewForm = true">
          <div class="add-icon">+</div>
          <div class="add-text">发起新需求</div>
        </div>
      </div>

      <!-- 草稿 -->
      <div v-if="activeTab === 'draft'" class="order-grid">
        <div class="order-card" v-for="order in draftOrders" :key="order.id" @click="goToOrder(order)">
          <div class="card-header">
            <span class="order-id">{{order.id}}</span>
            <span class="order-status draft">草稿</span>
          </div>
          <div class="card-title">{{order.title}}</div>
          <div class="card-info">
            <div>发起人：{{order.creator}}</div>
            <div>部门：{{order.dept}}</div>
            <div>类型：{{order.type}}</div>
          </div>
          <div class="card-footer">保存于 {{order.saveTime}}</div>
        </div>
      </div>

      <!-- 流转中 -->
      <div v-if="activeTab === 'flowing'" class="order-grid">
        <div class="order-card" v-for="order in flowingOrders" :key="order.id" @click="goToOrder(order)">
          <div class="card-header">
            <span class="order-id">{{order.id}}</span>
            <span class="order-status flowing">流转中</span>
          </div>
          <div class="card-title">{{order.title}}</div>
          <div class="card-info">
            <div>发起人：{{order.creator}}</div>
            <div>当前环节：{{order.currentNode}}</div>
            <div>已用时：{{order.usedTime}}</div>
          </div>
          <div class="progress-bar"><div class="progress-fill" :style="{width: order.progress + '%'}"></div></div>
          <div class="card-footer">发起于 {{order.startTime}}</div>
        </div>
      </div>
    </div>

    <!-- 新建表单弹窗 -->
    <div class="modal-overlay" v-if="showNewForm" @click="showNewForm = false">
      <div class="form-panel" @click.stop>
        <div class="form-header">
          <div class="form-title">✨ 新建业务需求</div>
          <button class="form-close" @click="showNewForm = false">✕</button>
        </div>
        <div class="form-content">
          <div class="form-group"><label>需求标题</label><input v-model="newForm.title" placeholder="请输入需求标题"></div>
          <div class="form-group">
            <label>需求类型</label>
            <select v-model="newForm.type">
              <option value="">请选择</option>
              <option>5G基站建设</option><option>家宽建设</option><option>政企专线</option>
              <option>沿街商铺</option><option>垂直行业</option><option>集家客维护</option><option>现网资源维护</option>
            </select>
          </div>
          <div class="form-group">
            <label>发起部门</label>
            <select v-model="newForm.dept">
              <option value="">请选择</option>
              <option>市场经营部</option><option>政企客户部</option><option>客户服务中心</option>
              <option>网络部</option><option>工程建设部</option><option>客户响应中心</option>
            </select>
          </div>
          <div class="form-group"><label>联系人</label><input v-model="newForm.creator" placeholder="请输入联系人"></div>
          <div class="form-group"><label>需求描述</label><textarea v-model="newForm.desc" rows="3"></textarea></div>
          <div class="form-group">
            <label>优先级</label>
            <select v-model="newForm.priority">
              <option value="normal">一般</option><option value="urgent">紧急</option><option value="critical">重大</option>
            </select>
          </div>
        </div>
        <div class="form-footer">
          <button class="btn-draft" @click="saveDraft">保存草稿</button>
          <button class="btn-submit" @click="submitOrder">提交流转</button>
        </div>
      </div>
    </div>

    <!-- 详情页（路由 /form/:orderId） -->
    <div class="detail-page" v-if="isDetailMode && currentOrder">
      <div class="detail-panel">
        <div class="detail-header">
          <div>
            <span class="detail-id">{{currentOrder.id}}</span>
            <span :class="['detail-status', currentOrder.statusClass]">{{currentOrder.statusText}}</span>
          </div>
          <button class="detail-close" @click="goBack">← 返回列表</button>
        </div>
        <div class="detail-content">
          <div class="info-section">
            <h3>📋 工单信息</h3>
            <div class="info-grid">
              <div><span class="lbl">标题：</span>{{currentOrder.title}}</div>
              <div><span class="lbl">类型：</span>{{currentOrder.type}}</div>
              <div><span class="lbl">发起人：</span>{{currentOrder.creator}}</div>
              <div><span class="lbl">部门：</span>{{currentOrder.dept}}</div>
              <div><span class="lbl">创建：</span>{{currentOrder.createTime || currentOrder.startTime}}</div>
              <div><span class="lbl">优先级：</span><span :class="['pri', currentOrder.priority]">{{currentOrder.priorityText || '一般'}}</span></div>
            </div>
            <div class="desc-box" v-if="currentOrder.desc"><span class="lbl">需求描述：</span>{{currentOrder.desc}}</div>
          </div>

          <div class="topology-section" v-if="currentOrder.topology">
            <h3>🔄 闭环动态拓扑图</h3>
            <div class="topology-canvas">
              <div class="topology-nodes">
                <div v-for="(node, idx) in currentOrder.topology" :key="idx"
                  :class="['topo-node', node.type, node.statusClass, {current: node.isCurrent, completed: node.isCompleted}]"
                  :style="{left: ((idx + 0.5) / currentOrder.topology.length * 100) + '%'}"
                  @click="selectedNode = node">
                  <div class="node-icon">{{node.icon}}</div>
                  <div class="node-name">{{node.name}}</div>
                  <div class="node-ripple" v-if="node.isCurrent"></div>
                </div>
              </div>
              <svg class="topology-lines" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lg" x1="0%" y1="0%" x2="100%">
                    <stop offset="0%" stop-color="#3b82f6"/>
                    <stop offset="100%" stop-color="#10b981"/>
                  </linearGradient>
                </defs>
                <path v-for="(_, i) in currentOrder.topology.length - 1" :key="i"
                  :d="'M ' + ((i + 0.5) / currentOrder.topology.length * 100) + ' 50 L ' + ((i + 1.5) / currentOrder.topology.length * 100) + ' 50'"
                  fill="none" stroke="url(#lg)" stroke-width="3" class="topo-line-animated"/>
              </svg>
            </div>
            <div class="node-detail" v-if="selectedNode">
              <div class="nd-header"><span class="ni">{{selectedNode.icon}}</span> {{selectedNode.name}}</div>
              <div><span class="lbl">状态：</span><span :class="selectedNode.statusClass">{{selectedNode.statusText}}</span></div>
              <div><span class="lbl">总时长：</span>{{selectedNode.totalTime}}</div>
              <div><span class="lbl">已用：</span>{{selectedNode.usedTime}}</div>
              <div><span class="lbl">责任人：</span>{{selectedNode.handler}}</div>
              <div><span class="lbl">是否解决：</span>{{selectedNode.resolved ? '✅ 已解决' : '❌ 未解决'}}</div>
              <div v-if="selectedNode.remaining"><span class="lbl">剩余流转：</span>{{selectedNode.remaining}}</div>
              <div v-if="selectedNode.factors" class="factors"><span class="lbl">不具备条件：</span>{{selectedNode.factors}}</div>
            </div>
          </div>

          <div class="resolve-section" v-if="currentOrder.resolveStatus">
            <h3>🎯 解决状态</h3>
            <div :class="['resolve-status', currentOrder.resolveStatus]">
              <div class="si">{{currentOrder.resolveStatus === 'resolved' ? '✅' : currentOrder.resolveStatus === 'partial' ? '🔄' : '❌'}}</div>
              <div>{{currentOrder.resolveStatus === 'resolved' ? '已完全解决，闭环完成' : currentOrder.resolveStatus === 'partial' ? '部分解决，剩余' + currentOrder.remainingPart + '需流转联动' : '未解决，标注不具备条件的因素'}}</div>
              <div class="note" v-if="currentOrder.resolveNote">{{currentOrder.resolveNote}}</div>
            </div>
          </div>

          <div class="bg-section">
            <h3>🌐 事件背景</h3>
            <div>中国移动内部各部门消除壁垒提质增效，助力移动在AI元年的市场发展，提升口碑声誉和行业影响力。网络条线通过"握手协同"机制实现资源整合、问题共解、效能提升。</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
>

<script setup>
import {ref, computed, watch} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'
const router = useRouter()
const route = useRoute()

const activeTab = ref('new')
const showNewForm = ref(false)
const selectedNode = ref(null)
const newForm = ref({title:'',type:'',dept:'',creator:'',desc:'',priority:'normal'})

// 根据路由参数判断是列表页还是详情页
const orderId = computed(() => route.params.orderId)

// 当前 URL 有 orderId 时显示详情，否则显示列表
const isDetailMode = computed(() => !!orderId.value)

// 获取当前查看的工单
const currentOrder = computed(() => {
  if (!orderId.value) return null
  const all = [...newOrders.value, ...draftOrders.value, ...flowingOrders.value]
  return all.find(o => o.id === orderId.value) || null
})

// 切换到工单详情
function goToOrder(order) {
  router.push('/form/' + order.id)
}

// 从详情页返回列表
function goBack() {
  router.push('/form')
}

// 根据tab自动展示有该工单的tab
watch(orderId, (id) => {
  if (id) {
    const all = [...newOrders.value, ...draftOrders.value, ...flowingOrders.value]
    const found = all.find(o => o.id === id)
    if (found) {
      if (found.statusClass === 'new') activeTab.value = 'new'
      else if (found.statusClass === 'draft') activeTab.value = 'draft'
      else activeTab.value = 'flowing'
    }
  }
})

const newOrders = ref([
  {id:'REQ-20260402-001',title:'政企客户部办公楼5G室分覆盖需求',creator:'李明',dept:'政企客户部',type:'5G基站建设',createTime:'2026-04-02 09:30',statusClass:'new',statusText:'新建'},
  {id:'REQ-20260402-002',title:'昆区某小区家宽建设需求',creator:'王芳',dept:'市场经营部',type:'家宽建设',createTime:'2026-04-02 10:15',statusClass:'new',statusText:'新建'},
  {id:'REQ-20260402-003',title:'某工厂政企专线接入需求',creator:'张强',dept:'政企客户部',type:'政企专线',createTime:'2026-04-02 11:00',statusClass:'new',statusText:'新建'},
])
const draftOrders = ref([
  {id:'REQ-20260401-015',title:'九原区商业街沿街商铺宽带接入',creator:'赵伟',dept:'市场经营部',type:'沿街商铺',saveTime:'2026-04-01 16:30',statusClass:'draft',statusText:'草稿'},
  {id:'REQ-20260401-016',title:'某医院垂直行业5G专网需求',creator:'刘洋',dept:'政企客户部',type:'垂直行业',saveTime:'2026-04-01 17:45',statusClass:'draft',statusText:'草稿'},
])
const flowingOrders = ref([
  {id:'REQ-20260328-008',title:'某工业园区5G基站建设需求',creator:'陈刚',dept:'政企客户部',type:'5G基站建设',currentNode:'工程建设部',usedTime:'3天5小时',progress:65,startTime:'2026-03-28 09:00',statusClass:'flowing',statusText:'流转中',topology:[
    {type:'start',name:'政企客户部',icon:'🏢',handler:'陈刚',statusText:'已提交',statusClass:'completed',isCompleted:true,totalTime:'2小时',usedTime:'1.5小时',resolved:true,isCurrent:false},
    {type:'node',name:'网络部',icon:'🌐',handler:'王磊',statusText:'预审中',statusClass:'processing',isCompleted:false,isCurrent:true,totalTime:'5工作日',usedTime:'2工作日',resolved:null},
    {type:'node',name:'工程建设部',icon:'🏗️',handler:'李强',statusText:'待接收',statusClass:'pending',isCompleted:false,isCurrent:false,totalTime:'10工作日',usedTime:'0',resolved:null},
    {type:'node',name:'客户响应中心',icon:'📞',handler:'张华',statusText:'待接收',statusClass:'pending',isCompleted:false,isCurrent:false,totalTime:'3工作日',usedTime:'0',resolved:null},
    {type:'end',name:'闭环',icon:'✅',handler:'-',statusText:'完成',statusClass:'resolved',isCompleted:false,isCurrent:false},
  ],resolveStatus:'partial',remainingPart:'工程建设部+客户响应中心',resolveNote:'部分解决，资源调配中'},
  {id:'REQ-20260325-003',title:'昆区某小区家宽覆盖需求',creator:'孙丽',dept:'市场经营部',type:'家宽建设',currentNode:'客户响应中心',usedTime:'5天2小时',progress:82,startTime:'2026-03-25 14:00',statusClass:'flowing',statusText:'流转中',topology:[
    {type:'start',name:'市场经营部',icon:'🏢',handler:'孙丽',statusText:'已解决',statusClass:'completed',isCompleted:true,totalTime:'1工作日',usedTime:'0.5工作日',resolved:true,isCurrent:false},
    {type:'node',name:'网络部',icon:'🌐',handler:'赵鹏',statusText:'已解决',statusClass:'completed',isCompleted:true,totalTime:'3工作日',usedTime:'2.5工作日',resolved:true,isCurrent:false},
    {type:'node',name:'工程建设部',icon:'🏗️',handler:'周明',statusText:'已解决',statusClass:'completed',isCompleted:true,totalTime:'8工作日',usedTime:'7工作日',resolved:true,isCurrent:false},
    {type:'node',name:'客户响应中心',icon:'📞',handler:'吴静',statusText:'处理中',statusClass:'processing',isCompleted:false,isCurrent:true,totalTime:'2工作日',usedTime:'1工作日',resolved:null},
    {type:'end',name:'闭环',icon:'✅',handler:'-',statusText:'完成',statusClass:'pending',isCompleted:false,isCurrent:false},
  ],resolveStatus:'partial',remainingPart:'客户响应中心',resolveNote:'安装调试中，预计明日完成'},
  {id:'REQ-20260320-001',title:'某医院5G专网接入需求',creator:'郑浩',dept:'政企客户部',type:'政企专线',currentNode:'网络部',usedTime:'10天3小时',progress:45,startTime:'2026-03-20 10:00',statusClass:'flowing',statusText:'流转中',topology:[
    {type:'start',name:'政企客户部',icon:'🏢',handler:'郑浩',statusText:'已提交',statusClass:'completed',isCompleted:true,totalTime:'2小时',usedTime:'1小时',resolved:true,isCurrent:false},
    {type:'node',name:'网络部',icon:'🌐',handler:'陈思',statusText:'评估中',statusClass:'processing',isCompleted:false,isCurrent:true,totalTime:'5工作日',usedTime:'3工作日',resolved:null,factors:'需要新增基站，审批流程较长'},
    {type:'node',name:'工程建设部',icon:'🏗️',handler:'待分配',statusText:'待接收',statusClass:'pending',isCompleted:false,isCurrent:false},
    {type:'node',name:'客户响应中心',icon:'📞',handler:'待分配',statusText:'待接收',statusClass:'pending',isCompleted:false,isCurrent:false},
    {type:'end',name:'闭环',icon:'✅',handler:'-',statusText:'待完成',statusClass:'pending',isCompleted:false,isCurrent:false},
  ],resolveStatus:'unresolved',remainingPart:'网络部评估+工程建设',resolveNote:'需要新增基站，审批流程较长（预计15工作日），已标注不具备快速解决的条件因素'},
])

// openOrderDetail removed - using goToOrder + router now
function saveDraft(){
  draftOrders.value.unshift({id:'REQ-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+String(draftOrders.value.length+1).padStart(3,'0'),title:newForm.value.title||'未命名',creator:newForm.value.creator||'未知',dept:newForm.value.dept||'未知',type:newForm.value.type||'其他',saveTime:new Date().toLocaleString('zh-CN'),statusClass:'draft',statusText:'草稿'})
  showNewForm.value=false;newForm.value={title:'',type:'',dept:'',creator:'',desc:'',priority:'normal'}
}
function submitOrder(){
  newOrders.value.unshift({id:'REQ-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+String(newOrders.value.length+1).padStart(3,'0'),title:newForm.value.title||'未命名',creator:newForm.value.creator||'未知',dept:newForm.value.dept||'未知',type:newForm.value.type||'其他',createTime:new Date().toLocaleString('zh-CN'),statusClass:'new',statusText:'新建',desc:newForm.value.desc,priority:newForm.value.priority,priorityText:newForm.value.priority==='critical'?'重大':newForm.value.priority==='urgent'?'紧急':'一般'})
  showNewForm.value=false;newForm.value={title:'',type:'',dept:'',creator:'',desc:'',priority:'normal'};alert('需求已提交流转！')
}
</script>

<style scoped>
.demand-container{width:100%;min-height:100vh;background:var(--bg-primary);color:var(--text-primary)}
.demand-header{padding:20px;text-align:center;border-bottom:1px solid var(--border-color)}
.back-btn{position:absolute;left:20px;top:20px;background:var(--bg-secondary);border:1px solid var(--border-color);color:var(--text-primary);padding:8px 16px;border-radius:8px;cursor:pointer}
.header-title{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px}
.title-text{font-size:1.5rem;font-weight:700;background:linear-gradient(90deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.header-subtitle{color:var(--text-secondary);font-size:.85rem}
.tab-nav{display:flex;justify-content:center;gap:12px;padding:16px;background:var(--bg-secondary);border-bottom:1px solid var(--border-color)}
.tab-btn{display:flex;align-items:center;gap:8px;padding:12px 24px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:12px;color:var(--text-secondary);cursor:pointer}
.tab-btn.active{background:var(--accent);color:#fff}
.tab-count{background:var(--accent-bg);padding:2px 8px;border-radius:10px;font-size:.75rem}
.tab-count.flowing{background:#f59e0b;color:#0f172a}
.order-list{padding:20px}
.order-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.order-card{background:var(--bg-card);border-radius:12px;padding:16px;border:1px solid var(--border-color);cursor:pointer;transition:all .3s}
.order-card:hover{transform:translateY(-4px);box-shadow:0 8px 24px var(--shadow);border-color:var(--accent)}
.card-header{display:flex;justify-content:space-between;margin-bottom:12px}
.order-id{font-size:.8rem;color:#F3F3F3;font-family:monospace}
.order-status{padding:4px 10px;border-radius:12px;font-size:.75rem;font-weight:600}
.order-status.new{background:var(--accent);color:#fff}.order-status.draft{background:var(--text-muted);color:#fff}.order-status.flowing{background:#f59e0b;color:#0f172a}
.card-title{font-weight:600;font-size:1rem;margin-bottom:12px}
.card-info{font-size:.85rem;color:#94a3b8;margin-bottom:12px}
.card-footer{font-size:.75rem;color:#475569}
.progress-bar{height:4px;background:#334155;border-radius:2px;margin-bottom:12px}
.progress-fill{height:100%;background:linear-gradient(90deg,#3b82f6,#10b981);border-radius:2px;transition:width .3s}
.add-card{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:180px;border-style:dashed}
.add-icon{font-size:3rem;color:#3b82f6}.add-text{color:var(--text-secondary);font-size:.9rem}
.modal-overlay{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px)}
.form-panel{background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;width:90%;max-width:500px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column}
.form-header{display:flex;justify-content:space-between;padding:20px;background:var(--bg-secondary);border-bottom:1px solid var(--border-color)}
.form-title{font-weight:700;color:#60a5fa}
.form-close{background:var(--bg-secondary);border:1px solid var(--border-color);color:var(--text-secondary);width:28px;height:28px;border-radius:6px;cursor:pointer}
.form-content{padding:20px;overflow-y:auto;background:var(--bg-card)}
.form-group{margin-bottom:16px}
.form-group label{display:block;font-size:.85rem;color:#94a3b8;margin-bottom:6px}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:10px 12px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:.9rem}
.form-footer{display:flex;gap:12px;padding:16px 20px;border-top:1px solid #334155;background:#1e293b}
.btn-draft,.btn-submit{flex:1;padding:12px;border:none;border-radius:8px;font-size:.9rem;font-weight:600;cursor:pointer}
.btn-draft{background:var(--bg-secondary);color:var(--text-secondary)}
.btn-submit{background:var(--accent);color:#fff}
.detail-page{padding:20px;overflow-y:auto}.detail-panel{background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;width:100%;max-width:900px;overflow:hidden;display:flex;flex-direction:column;margin:0 auto}
.detail-header{display:flex;justify-content:space-between;padding:20px;background:var(--bg-secondary);border-bottom:1px solid var(--border-color)}
.detail-id{font-family:monospace;font-size:.9rem;color:#F3F3F3}
.detail-status{padding:4px 12px;border-radius:12px;font-size:.8rem;font-weight:600}
.detail-status.new{background:var(--accent);color:#fff}.detail-status.flowing{background:#f59e0b;color:#0f172a}.detail-status.resolved{background:#10b981;color:#fff}.detail-status.partial{background:#8b5cf6;color:#fff}.detail-status.unresolved{background:#ef4444;color:#fff}
.detail-close{background:var(--bg-secondary);border:1px solid var(--border-color);color:var(--text-primary);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:.9rem;transition:all .2s}.detail-close:hover{background:#ef4444;color:#fff}
.detail-content{flex:1;overflow-y:auto;padding:20px;background:var(--bg-card)}
.info-section,.topology-section,.resolve-section,.bg-section{background:var(--bg-secondary);border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid var(--border-color)}
h3{font-size:1rem;font-weight:600;color:var(--accent);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border-color)}
.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;font-size:.85rem}
.lbl{color:var(--text-muted)}
.pri{padding:2px 8px;border-radius:4px;font-size:.75rem}
.pri.normal{background:var(--bg-secondary);color:var(--text-secondary)}.pri.urgent{background:#f59e0b;color:#0f172a}.pri.critical{background:#ef4444;color:#fff}
.desc-box{background:var(--bg-secondary);border-radius:8px;padding:12px;margin-top:12px;font-size:.9rem}
.topology-canvas{position:relative;height:160px;width:100%;background:var(--bg-secondary);border-radius:12px;margin-bottom:16px;overflow:visible}
.topology-nodes{position:absolute;top:50%;left:0;right:0;transform:translateY(-50%)}
.topo-node{position:absolute;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;justify-content:center;width:70px;height:70px;border-radius:50%;background:var(--bg-secondary);cursor:pointer;z-index:10}
.topo-node.start{background:var(--accent)}.topo-node.end{background:#10b981}
.topo-node.current{background:#f59e0b;box-shadow:0 0 20px rgba(245,158,11,.5);animation:pulse 1.5s ease-in-out infinite}
.topo-node.completed{background:#10b981}
@keyframes pulse{0%,100%{box-shadow:0 0 20px rgba(245,158,11,.5)}50%{box-shadow:0 0 30px rgba(245,158,11,.8)}}
.node-icon{font-size:1.6rem;line-height:1;display:flex;align-items:center;justify-content:center}.node-name{font-size:.6rem;font-weight:700;color:var(--text-primary);white-space:nowrap;text-align:center;margin-top:4px;max-width:70px;overflow:hidden;text-overflow:ellipsis}
.node-ripple{position:absolute;width:100%;height:100%;border-radius:12px;border:2px solid rgba(255,255,255,.4);animation:ripple 1.5s ease-out infinite}
@keyframes ripple{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.3);opacity:0}}
.topology-lines{position:absolute;top:50%;left:0;right:0;width:100%;height:6px;transform:translateY(-50%);z-index:1}
.node-detail{background:var(--bg-secondary);border-radius:12px;padding:16px;border:1px solid var(--accent)}
.nd-header{font-weight:700;margin-bottom:8px;font-size:1rem;color:var(--text-primary)}.ni{font-size:1.25rem;margin-right:8px}
.resolve-status{display:flex;flex-direction:column;align-items:center;padding:20px;border-radius:12px;text-align:center}
.resolve-status.resolved{background:var(--accent-bg);border:1px solid #10b981}
.resolve-status.partial{background:var(--accent-bg);border:1px solid #8b5cf6}
.resolve-status.unresolved{background:var(--accent-bg);border:1px solid #ef4444}
.si{font-size:2rem;margin-bottom:8px}
.note{font-size:.85rem;color:#94a3b8;padding:8px 12px;background:rgba(0,0,0,.3);border-radius:8px;margin-top:8px}
.processing{color:#f59e0b}.completed{color:#10b981}.pending{color:#64748b}.factors{color:#ef4444;font-size:.8rem}
@media(max-width:768px){.order-grid{grid-template-columns:1fr}.topology-canvas{height:200px}.topology-nodes{display:flex;flex-direction:row;align-items:flex-start;justify-content:center;gap:4px;position:static;transform:none;flex-wrap:wrap}.topo-node{position:static;transform:none;width:58px;height:58px;border-radius:50%;flex-direction:column;gap:2px;padding:6px}.node-icon{font-size:1.2rem}.node-name{font-size:.55rem;margin-top:2px;max-width:50px}.topology-lines{display:none}}
</style>
