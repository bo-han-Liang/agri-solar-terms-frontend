import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Row, Col, Statistic, Input, Button, message, Descriptions, Timeline, Tag, Table, Select, Modal } from 'antd';
import { CloudOutlined, ExperimentOutlined, SafetyCertificateOutlined, SearchOutlined, DashboardOutlined, UserOutlined, SyncOutlined, DatabaseOutlined } from '@ant-design/icons';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import './App.css';

const { Header, Content, Sider, Footer } = Layout;

// 动态计算当前节气函数
const getCurrentTerm = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const terms = [
    { name: '小寒', date: [1, 5] }, { name: '大寒', date: [1, 20] },
    { name: '立春', date: [2, 4] }, { name: '雨水', date: [2, 19] },
    { name: '惊蛰', date: [3, 6] }, { name: '春分', date: [3, 21] },
    { name: '清明', date: [4, 5] }, { name: '谷雨', date: [4, 20] },
    { name: '立夏', date: [5, 6] }, { name: '小满', date: [5, 21] },
    { name: '芒种', date: [6, 6] }, { name: '夏至', date: [6, 21] },
    { name: '小暑', date: [7, 7] }, { name: '大暑', date: [7, 23] },
    { name: '立秋', date: [8, 8] }, { name: '处暑', date: [8, 23] },
    { name: '白露', date: [9, 8] }, { name: '秋分', date: [9, 23] },
    { name: '寒露', date: [10, 8] }, { name: '霜降', date: [10, 23] },
    { name: '立冬', date: [11, 7] }, { name: '小雪', date: [11, 22] },
    { name: '大雪', date: [12, 7] }, { name: '冬至', date: [12, 22] }
  ];
  for (let i = terms.length - 1; i >= 0; i--) {
    const [m, d] = terms[i].date;
    if (month > m || (month === m && day >= d)) return terms[i].name;
  }
  return '小寒';
};

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [siderKey, setSiderKey] = useState('1');
  const [isSyncing, setIsSyncing] = useState(false);
  const [queryId, setQueryId] = useState('');
  const [chainData, setChainData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ farmlands: 0, meteorological: 0, blockchain: 0, users: 0 });
  const [dataList, setDataList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [solarTermList, setSolarTermList] = useState([]);
  const [currentTerm, setCurrentTerm] = useState('');
  const [chainEvents, setChainEvents] = useState([]);
  const [allChainRecords, setAllChainRecords] = useState([]);
  const [unlinkedStats, setUnlinkedStats] = useState({ total: 0, linked: 0, unlinked: 0 });
  const [roleFilter, setRoleFilter] = useState('all');
  const [manualData, setManualData] = useState({ farmId: '', termId: '', temperature: '', humidity: '', rainfall: '' });

  // 🌟 修改点 1：新增的专家端发布建议表单状态（从 renderExpertPage 的 map 中上移到组件顶层）
  const [newSuggestion, setNewSuggestion] = useState({
    solar_term_id: '',
    crop_type: '',
    suggestion_content: '',
    expert_id: '' // 默认专家ID（张伟以外的 expert001，对应 users 表 id=31）
  });

  // 🌟 修改点 2：为管理员端农田管理、访问日志审计，以及农户端按农户过滤，新增的状态
  const [farmlandList, setFarmlandList] = useState([]);   // 管理员端：全部农田
  const [accessLogs, setAccessLogs] = useState([]);       // 管理员端：访问日志
  const [currentFarmerId, setCurrentFarmerId] = useState(1); // 当前登录农户ID（此处默认张伟 id=1）
  const [farmerFarmlands, setFarmerFarmlands] = useState([]); // 当前农户名下的农田集合

  const compassOption = {
    title: {
      text: '当前节气：' + currentTerm,
      right: 20,
      top: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
      borderColor: '#22c55e',
      borderWidth: 2,
      borderRadius: 8,
      padding: [10, 20],
      textStyle: {
        color: '#166534',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'KaiTi, STKaiti, "楷体", "华文楷体", serif'
      }
    },
    backgroundColor: 'transparent',
    polar: {
      center: ['40%', '50%'],
      radius: ['18%', '82%']
    },
    angleAxis: {
      type: 'category',
      data: ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'],
      boundaryGap: true,
      axisLine: {
        lineStyle: {
          color: '#8B4513',
          width: 3,
          shadowBlur: 6,
          shadowColor: 'rgba(139, 69, 19, 0.6)'
        }
      },
      axisTick: {
        lineStyle: {
          color: '#8B4513',
          width: 2
        },
        length: 12
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#8B4513',
          width: 1,
          type: 'solid'
        }
      },
      axisLabel: {
        color: '#5C3A1E',
        fontSize: 14,
        fontWeight: 'bold',
        margin: 22,
        fontFamily: 'KaiTi, STKaiti, "楷体", "华文楷体", serif'
      }
    },
    radiusAxis: {
      axisLine: {
        show: true,
        lineStyle: {
          color: '#8B4513',
          width: 2
        }
      },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#C9A06C',
          width: 1,
          type: 'dashed'
        }
      }
    },
    series: [
      {
        type: 'bar',
        data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        coordinateSystem: 'polar',
        barWidth: '78%',
        itemStyle: {
          color: (params) => {
            const name = params.name;
            const termIndex = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'].indexOf(name);

            const classicalColors = [
              '#8B0000', '#A52A2A', '#B22222', '#DC143C',
              '#CD5C5C', '#F08080', '#FF4500', '#FF6347',
              '#FF7F50', '#FFA500', '#FF8C00', '#DAA520',
              '#B8860B', '#8B4513', '#A0522D', '#8B7355',
              '#6B8E23', '#556B2F', '#2F4F4F', '#191970',
              '#4B0082', '#800080', '#8B008B', '#C71585'
            ];
            const baseColor = classicalColors[termIndex >= 0 ? termIndex : 0];

            if (name === currentTerm) {
              return {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#FFD700' },
                  { offset: 0.5, color: '#FFA500' },
                  { offset: 1, color: baseColor }
                ],
                shadowBlur: 30,
                shadowColor: '#FFD700',
                borderWidth: 4,
                borderColor: '#8B0000'
              };
            }

            return {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: baseColor },
                { offset: 1, color: baseColor }
              ],
              opacity: 0.88,
              borderRadius: 0,
              borderWidth: 1,
              borderColor: '#5C3A1E'
            };
          },
          borderRadius: 0
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 40,
            shadowColor: 'rgba(255, 215, 0, 1)',
            opacity: 1
          }
        },
        animationDuration: 1500,
        animationEasing: 'elasticOut'
      },
      {
        type: 'pie',
        radius: ['12%', '17%'],
        center: ['40%', '50%'],
        silent: true,
        label: { show: false },
        data: [
          { value: 1, itemStyle: { color: '#8B0000' } },
          { value: 1, itemStyle: { color: '#DAA520' } },
          { value: 1, itemStyle: { color: '#8B0000' } },
          { value: 1, itemStyle: { color: '#DAA520' } }
        ]
      }
    ]
  };

  // 页面加载时获取基础数据 + 全局定时刷新
  useEffect(() => {
    setCurrentTerm(getCurrentTerm());

    // 首次加载
    axios.get('http://localhost:3000/api/stats').then(res => { if (res.data.success) setStats(res.data.data); });
    axios.get('http://localhost:3000/api/solar_terms').then(res => { if (res.data.success) setSolarTermList(res.data.data); });
    axios.get('http://localhost:3000/api/users').then(res => { if (res.data.success) setUserList(res.data.data); });

    // 每 5 秒自动刷新统计数据
    const interval = setInterval(() => {
      setCurrentTerm(getCurrentTerm());
      axios.get('http://localhost:3000/api/stats').then(res => { if (res.data.success) setStats(res.data.data); });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 根据菜单切换获取不同数据
  useEffect(() => {
    // 🌟 修改点 3：农户端单独分支——除了拉气象数据，还要拉农田并按当前农户过滤
    if (activeMenu === 'farmer') {
      axios.get('http://localhost:3000/api/data/list').then(res => {
        if (res.data.success) setDataList(res.data.data);
      });
      axios.get('http://localhost:3000/api/farmlands').then(res => {
        if (res.data.success) {
          const myFarmlands = res.data.data.filter(f => f.farmer_id === currentFarmerId);
          setFarmerFarmlands(myFarmlands);
        }
      });
    }
    // 气象数据管理、数据大屏：拉气象数据列表
    if (activeMenu === 'met_data' || activeMenu === 'dashboard') {
      axios.get('http://localhost:3000/api/data/list').then(res => {
        if (res.data.success) setDataList(res.data.data);
      });
    }
    // 🌟 修改点 3：管理员端——除了用户列表，还要拉农田列表和访问日志
    if (activeMenu === 'admin') {
      axios.get('http://localhost:3000/api/users').then(res => {
        if (res.data.success) setUserList(res.data.data);
      });
      axios.get('http://localhost:3000/api/farmlands').then(res => {
        if (res.data.success) setFarmlandList(res.data.data);
      });
      axios.get('http://localhost:3000/api/access_logs').then(res => {
        if (res.data.success) setAccessLogs(res.data.data);
      });
    }
    if (activeMenu === 'expert') {
      axios.get('http://localhost:3000/api/suggestions').then(res => {
        if (res.data.success) setSuggestions(res.data.data);
      });
      axios.get('http://localhost:3000/api/users').then(res => {
        if (res.data.success) setUserList(res.data.data);
      });
    }
    // 加载全量存证记录
    if (activeMenu === 'chain_records') {
      axios.get('http://localhost:3000/api/blockchain/all').then(res => {
        if (res.data.success) setAllChainRecords(res.data.data);
      });
    }
    // 加载未上链统计数据（同步工具页、数据大屏都要用）
    if (activeMenu === 'sync_tools' || activeMenu === 'dashboard') {
      axios.get('http://localhost:3000/api/data/unlinked-stats').then(res => {
        if (res.data.success) setUnlinkedStats(res.data.data);
      });
    }
  }, [activeMenu]);

  // 动态获取最近上链足迹（每8秒自动刷新一次）
  useEffect(() => {
    const fetchLatestEvents = () => {
      axios.get('http://localhost:3000/api/blockchain/latest').then(res => {
        if (res.data.success) setChainEvents(res.data.data);
      });
    };
    fetchLatestEvents();
    const interval = setInterval(fetchLatestEvents, 8000);
    return () => clearInterval(interval);
  }, []);

    // 🌟 数据大屏图表数据自动刷新（每8秒刷新一次 dataList 和 unlinkedStats）
  useEffect(() => {
    if (activeMenu !== 'dashboard') return; // 只在数据大屏页面启用

    const fetchChartData = () => {
      axios.get('http://localhost:3000/api/data/list').then(res => {
        if (res.data.success) setDataList(res.data.data);
      });
      axios.get('http://localhost:3000/api/data/unlinked-stats').then(res => {
        if (res.data.success) setUnlinkedStats(res.data.data);
      });
    };

    fetchChartData(); // 进入页面立即拉一次
    const interval = setInterval(fetchChartData, 8000); // 每8秒拉一次

    return () => clearInterval(interval); // 离开数据大屏时清除定时器
  }, [activeMenu]);

  // 左侧菜单点击事件
  const handleSiderClick = (e) => {
    setSiderKey(e.key);
    if (e.key === '1') setActiveMenu('dashboard');
    if (e.key === '2') setActiveMenu('met_data');
    if (e.key === '3') setActiveMenu('chain_records');
  };

  // 查询区块链数据
  const handleQuery = async () => {
    if (!queryId) {
      message.warning('请输入要查询的数据 ID（例如 data001）');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/data/query/${queryId}`);
      if (res.data.success) {
        setChainData(res.data.data);
        message.success('链上数据查询成功！');
      }
    } catch (error) {
      message.error(error.response?.data?.error || '查询失败，请确认后端服务已启动且数据 ID 正确');
      setChainData(null);
    } finally {
      setLoading(false);
    }
  };

  // 模拟传感器存证（自动从数据库随机抓取一条数据上链）
  const handleStore = async () => {
    const randomFarm = Math.floor(Math.random() * 50) + 1;
    const randomTerm = Math.floor(Math.random() * 24) + 1;
    const testData = {
      farmId: randomFarm.toString(),
      termId: randomTerm.toString(),
      temperature: (Math.random() * 30).toFixed(2),
      humidity: (Math.random() * 40 + 50).toFixed(0),
      rainfall: (Math.random() * 20).toFixed(2),
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }).replace(/\//g, '-')
    };
    try {
      const res = await axios.post('http://localhost:3000/api/data/store', testData);
      if (res.data.success) {
        message.success('模拟数据已成功上链！自动生成的链上 ID 为: data' + res.data.newDataId);
        setQueryId('data' + res.data.newDataId.toString().padStart(3, '0'));
        axios.get('http://localhost:3000/api/data/list').then(r => setDataList(r.data.data));
        axios.get('http://localhost:3000/api/stats').then(r => setStats(r.data.data));
      }
    } catch (error) {
      message.error('存证失败，请检查后端服务');
    }
  };

  const handleManualStore = async () => {
    if (!manualData.farmId || !manualData.termId || !manualData.temperature || !manualData.humidity || !manualData.rainfall) {
      message.warning('请填写完整的农田编号、节气编号、温度、湿度和降雨量');
      return;
    }
    const testData = {
      farmId: manualData.farmId,
      termId: manualData.termId,
      temperature: manualData.temperature,
      humidity: manualData.humidity,
      rainfall: manualData.rainfall,
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }).replace(/\//g, '-')
    };
    try {
      const res = await axios.post('http://localhost:3000/api/data/store', testData);
      if (res.data.success) {
        message.success('自定义数据已成功上链！自动生成的链上 ID 为: data' + res.data.newDataId);
        setQueryId('data' + res.data.newDataId.toString().padStart(3, '0'));
        axios.get('http://localhost:3000/api/data/list').then(r => setDataList(r.data.data));
        axios.get('http://localhost:3000/api/stats').then(r => setStats(r.data.data));
      }
    } catch (error) {
      message.error('存证失败，请检查后端服务');
    }
  };

  // 批量同步上链（优化版：后台异步 + 前端有限轮询）
  const handleSyncAll = async () => {
    if (isSyncing) {
      message.warning('正在同步中，请勿重复点击');
      return;
    }
    setIsSyncing(true);
    message.loading('正在启动批量同步任务...', 1);
    try {
      const res = await axios.post('http://localhost:3000/api/data/sync-all');
      if (res.data.success) {
        message.success('后台同步任务已启动，正在处理，请稍候...');

        let pollCount = 0;
        const maxPolls = 60;

        const interval = setInterval(() => {
          pollCount++;
          axios.get('http://localhost:3000/api/data/unlinked-stats').then(res => {
            if (res.data.success) {
              setUnlinkedStats(res.data.data);

              if (res.data.data.unlinked === 0 || pollCount >= maxPolls) {
                clearInterval(interval);
                setIsSyncing(false);

                if (res.data.data.unlinked === 0) {
                  message.success('全部数据已成功同步上链！');
                } else {
                  message.warning(`同步已停止（仍有 ${res.data.data.unlinked} 条未上链），请检查 Fabric 网络是否正常运行。`);
                }

                axios.get('http://localhost:3000/api/data/list').then(r => setDataList(r.data.data));
                axios.get('http://localhost:3000/api/stats').then(r => setStats(r.data.data));
                axios.get('http://localhost:3000/api/blockchain/all').then(r => setAllChainRecords(r.data.data));
              }
            }
          });
        }, 3000);
      }
    } catch (error) {
      message.error('批量同步请求失败，请检查后端服务');
      setIsSyncing(false);
    }
  };

  // 删除数据（使用 Ant Design Modal，替代 window.confirm）
  const handleDelete = (id) => {
    Modal.confirm({
      title: '删除确认',
      content: '确认删除该条气象数据吗？此操作不可撤销。',
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      className: 'custom-delete-modal',
      onOk: async () => {
        try {
          const res = await axios.delete(`http://localhost:3000/api/data/delete/${id}`);
          if (res.data.success) {
            message.success('数据已成功删除');
            axios.get('http://localhost:3000/api/data/list').then(r => setDataList(r.data.data));
            axios.get('http://localhost:3000/api/stats').then(r => setStats(r.data.data));
            axios.get('http://localhost:3000/api/data/unlinked-stats').then(r => setUnlinkedStats(r.data.data));
          }
        } catch (error) {
          message.error('删除失败，请检查后端服务');
        }
      }
    });
  };

  // 删除农事建议（专家端用）
  const handleDeleteSuggestion = (id) => {
    Modal.confirm({
      title: '删除建议确认',
      content: '确认删除该条农事建议吗？此操作不可撤销。',
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      className: 'custom-delete-modal',
      onOk: async () => {
        try {
          const res = await axios.delete(`http://localhost:3000/api/suggestions/${id}`);
          if (res.data.success) {
            message.success('建议已成功删除');
            axios.get('http://localhost:3000/api/suggestions').then(r => {
              if (r.data.success) setSuggestions(r.data.data);
            });
          }
        } catch (error) {
          message.error(error.response?.data?.error || '删除建议失败，请检查后端服务');
        }
      }
    });
  };

  // 图表配置
  const chartOption = {
    title: { text: '二十四节气气象数据变化趋势', left: 'center', top: 10 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['温度(℃)', '湿度(%)'], top: 45 },
    grid: { top: 90, bottom: 40, left: 50, right: 30 },
    xAxis: { type: 'category', data: ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'] },
    yAxis: { type: 'value' },
    series: [
      { name: '温度(℃)', type: 'line', smooth: true, data: [5, 8, 12, 15, 20, 22, 26, 28, 30, 32, 35, 36, 32, 28, 25, 20, 15, 12, 8, 5, 2, 0, 2, 4], itemStyle: { color: '#ff4d4f' }, lineStyle: { width: 3 }, areaStyle: { color: 'rgba(255, 77, 79, 0.1)' } },
      { name: '湿度(%)', type: 'line', smooth: true, data: [60, 65, 55, 50, 70, 75, 80, 85, 80, 75, 70, 65, 60, 65, 70, 75, 80, 85, 90, 85, 80, 75, 70, 65], itemStyle: { color: '#1890ff' }, lineStyle: { width: 3 }, areaStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    ]
  };

    // 新增：区块链上链进度环形图配置
  const pieOption = {
    title: { text: '区块链上链进度', left: 'center', top: 10 },
    tooltip: { trigger: 'item' },
    legend: { bottom: 10 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c} ({d}%)' },
      data: [
        { value: unlinkedStats.linked || 0, name: '已上链', itemStyle: { color: '#22c55e' } },
        { value: unlinkedStats.unlinked || 0, name: '未上链', itemStyle: { color: '#f59e0b' } }
      ]
    }]
  };

  // 新增：气象数据温度区间分布直方图配置
  const barOption = {
    title: { text: '气象数据温度区间分布', left: 'center', top: 10 },
    tooltip: { 
      trigger: 'axis',
      formatter: '{b}: {c} 条数据'
    },
    grid: { top: 60, bottom: 40, left: 50, right: 30 },
    xAxis: { 
      type: 'category', 
      data: ['<0℃', '0~10℃', '10~20℃', '20~30℃', '≥30℃'],
      axisLabel: { fontSize: 12, fontWeight: 'bold', color: '#334155' }
    },
    yAxis: { 
      type: 'value', 
      name: '数据条数',
      nameTextStyle: { color: '#334155', fontWeight: 'bold' }
    },
    series: [{
      type: 'bar',
      barWidth: '50%',
      data: [
        dataList.filter(d => parseFloat(d.temperature) < 0).length,
        dataList.filter(d => parseFloat(d.temperature) >= 0 && parseFloat(d.temperature) < 10).length,
        dataList.filter(d => parseFloat(d.temperature) >= 10 && parseFloat(d.temperature) < 20).length,
        dataList.filter(d => parseFloat(d.temperature) >= 20 && parseFloat(d.temperature) < 30).length,
        dataList.filter(d => parseFloat(d.temperature) >= 30).length
      ],
      itemStyle: {
        color: (params) => {
          const colors = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444'];
          return colors[params.dataIndex];
        },
        borderRadius: [6, 6, 0, 0]
      },
      label: { show: true, position: 'top', fontWeight: 'bold', color: '#1e293b' }
    }]
  };


  // 渲染数据大屏
  const renderDashboard = () => (
    <div>
      <Card style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)', border: '1px solid #91d5ff' }}>
        <Row align="middle" gutter={16}>
          <Col span={4} style={{ textAlign: 'center', fontSize: '40px' }}>🌱</Col>
          <Col span={20}>
            <h2 style={{ margin: 0, color: '#0050b3' }}>当前节气：{currentTerm}</h2>
            <p style={{ margin: '5px 0 0', color: '#666' }}>智慧农业系统已为您实时监测农田气象数据并上链存证。</p>
          </Col>
        </Row>
      </Card>

      <Row className="dash-stats" gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={6}><Card><Statistic title="系统总农田" value={stats.farmlands} suffix="块" prefix={<ExperimentOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="气象数据存证" value={stats.meteorological} suffix="条" prefix={<SafetyCertificateOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="已上链交易" value={stats.blockchain} suffix="笔" prefix={<CloudOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="系统用户" value={stats.users} suffix="人" prefix={<UserOutlined />} /></Card></Col>
      </Row>

      <Card className="dash-compass" title="🌿 当前节气与二十四节气罗盘" style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', height: '500px' }}>
          <div style={{ height: '100%', paddingRight: '200px' }}>
            <ReactECharts option={compassOption} style={{ height: '100%', width: '100%' }} />
          </div>
                    <div style={{ position: 'absolute', right: '0', top: '0', bottom: '0', width: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', writingMode: 'vertical-rl', fontSize: '28px', fontWeight: 'bold', color: '#166534', letterSpacing: '12px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>二十四节气罗盘</div>
        </div>
      </Card>

      <Card className="dash-chart" title="📈 节气气象数据趋势分析" style={{ marginBottom: '20px' }}><ReactECharts option={chartOption} style={{ height: '400px' }} /></Card>
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={12}>
          <Card className="dash-chart" title="📊 区块链存证上链进度">
            <ReactECharts option={pieOption} style={{ height: '350px' }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="dash-chart" title="📊 各农田气象数据分布">
            <ReactECharts option={barOption} style={{ height: '350px' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={12}>
      <Card className="dash-query" title="📖 区块链存证查询（请输入你在链码里写入的数据ID，例如 data001）" style={{ height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <Input placeholder="输入数据 ID" value={queryId} onChange={(e) => setQueryId(e.target.value)} onPressEnter={handleQuery} style={{ width: '100%' }} />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleQuery} loading={loading}>查询链上数据</Button>
            <Button type="default" icon={<SafetyCertificateOutlined />} onClick={handleStore} style={{ borderColor: '#22c55e', color: '#166534' }}>模拟传感器存证</Button>
            <Button type="primary" icon={<CloudOutlined />} onClick={handleSyncAll} loading={isSyncing} disabled={isSyncing} style={{ backgroundColor: '#166534', borderColor: '#166534' }}>批量同步上链</Button>
          </div>

          <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px dashed #22c55e' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#166534', textAlign: 'center' }}>自行存证操作</h4>
            <Row gutter={[0, 12]}>
              <Col span={24}>
                <Input placeholder="农田编号(1-50)" value={manualData.farmId} onChange={(e) => setManualData({ ...manualData, farmId: e.target.value })} />
              </Col>
              <Col span={24}>
                <Input placeholder="节气编号(1-24)" value={manualData.termId} onChange={(e) => setManualData({ ...manualData, termId: e.target.value })} />
              </Col>
              <Col span={24}>
                <Input placeholder="温度(℃)" value={manualData.temperature} onChange={(e) => setManualData({ ...manualData, temperature: e.target.value })} />
              </Col>
              <Col span={24}>
                <Input placeholder="湿度(%)" value={manualData.humidity} onChange={(e) => setManualData({ ...manualData, humidity: e.target.value })} />
              </Col>
              <Col span={24}>
                <Input placeholder="降雨量(mm)" value={manualData.rainfall} onChange={(e) => setManualData({ ...manualData, rainfall: e.target.value })} />
              </Col>
              <Col span={24}>
                <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleManualStore} style={{ width: '100%', backgroundColor: '#166534', borderColor: '#166534' }}>手动存证上链</Button>
              </Col>
            </Row>
          </div>
        </div>
        {chainData && (
          <Descriptions title="区块链存证详情" bordered column={1}>
            <Descriptions.Item label="数据 ID">{chainData.dataId}</Descriptions.Item>
            <Descriptions.Item label="农田 ID">{chainData.farmId}</Descriptions.Item>
            <Descriptions.Item label="节气 ID">{chainData.termId}</Descriptions.Item>
            <Descriptions.Item label="数据指纹 (SHA-256)"><Tag color="green">{chainData.dataHash}</Tag></Descriptions.Item>
            <Descriptions.Item label="存证时间">{chainData.timestamp}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

        </Col>
        <Col span={12}>
      <Card className="dash-timeline" title="🔗 最近上链足迹" style={{ height: '100%' }}>
        <Timeline items={chainEvents.length > 0 ? chainEvents.map((item) => ({
          children: (<div style={{ color: '#1e293b', lineHeight: '1.8' }}>
              <div style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: '4px' }}>[{item.timestamp ? item.timestamp.substring(0, 19).replace('T', ' ') : '刚刚'}]</div>
              <div>数据 ID: {item.data_id} 成功上链</div>
              <div style={{ wordbreak: 'break-all' }}>交易哈希: {item.tx_id ? item.tx_id : '生成中'}</div>
              <div>状态: {item.status || '已上链'}</div>
            </div>),
          color: '#22c55e'
        })) : [{ children: '暂无上链足迹', color: 'gray' }]} />
      </Card>
        </Col>
      </Row>

    </div>
  );

  // 🌟 修改点 4：农户端按当前农户过滤（不再展示全部气象数据）
  // 🌟 修改点：恢复农户端显示全部气象数据（不再按农户过滤）
  const renderFarmerPage = () => {
    const farmerData = dataList;
    return (
      <Card className="table-farmer" title="农户端 - 我的农田气象数据" style={{ marginBottom: '20px' }}>
        <p style={{ color: '#666' }}>当前登录农户：张伟。以下数据展示了系统监测到的所有农田气象数据，并已通过区块链存证。</p>
        <Table
          dataSource={farmerData} rowKey="id" bordered size="middle"
          columns={[
            { title: '数据编号', dataIndex: 'id', key: 'id' },
            { title: '农田编号', dataIndex: 'farmland_id', key: 'farmland_id' },
            { title: '温度(℃)', dataIndex: 'temperature', key: 'temperature', render: (text) => <Tag color={text > 30 ? 'red' : text < 10 ? 'blue' : 'green'}>{text}</Tag> },
            { title: '湿度(%)', dataIndex: 'humidity', key: 'humidity' },
            { title: '降雨量(mm)', dataIndex: 'rainfall', key: 'rainfall' },
            { title: '记录时间', dataIndex: 'record_time', key: 'record_time' },
            { title: '链上哈希', dataIndex: 'data_hash', key: 'data_hash', ellipsis: true },
          ]}
        />
      </Card>
    );
  };

  // 🌟 修改点 1（续）：修复专家端，useState 不再出现在 map 回调内部
  // 🌟 修改点：专家端发布建议，下拉框去掉年份显示
  const renderExpertPage = () => {
    const expertSuggestions = suggestions.map(item => {
      const expert = userList.find(u => u.id === item.expert_id);
      const term = solarTermList.find(t => t.id === item.solar_term_id);

      return {
        ...item,
        expertName: expert ? expert.real_name : '未知专家',
        termName: term ? term.term_name : item.solar_term_id
      };
    });

    return (
      <Card className="table-expert" title="专家端 - 农事指导与建议库" style={{ marginBottom: '20px' }}>
        <p>以下是各位农业专家针对二十四节气发布的农事指导建议，供农户参考。数据来源于 MySQL 数据库。</p>
        <div style={{ marginBottom: 16, padding: 16, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8 }}>
          <h4>发布新农事建议</h4>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <Select
              placeholder="选择节气"
              style={{ width: 150 }}
              value={newSuggestion.solar_term_id || undefined}
              onChange={(value) => setNewSuggestion({ ...newSuggestion, solar_term_id: value })}
            >
              {solarTermList.map(term => (
                <Select.Option key={term.id} value={term.id}>{term.term_name}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="选择作物类型"
              style={{ width: 150 }}
              value={newSuggestion.crop_type || undefined}
              onChange={(value) => setNewSuggestion({ ...newSuggestion, crop_type: value })}
            >
              <Select.Option value="小麦">小麦</Select.Option>
              <Select.Option value="玉米">玉米</Select.Option>
              <Select.Option value="水稻">水稻</Select.Option>
              <Select.Option value="大豆">大豆</Select.Option>
              <Select.Option value="蔬菜">蔬菜</Select.Option>
              <Select.Option value="果树">果树</Select.Option>
              <Select.Option value="棉花">棉花</Select.Option>
              <Select.Option value="油菜">油菜</Select.Option>
            </Select>

            <Select
              placeholder="选择专家"
              style={{ width: 150 }}
              value={newSuggestion.expert_id || undefined}
              onChange={(value) => setNewSuggestion({ ...newSuggestion, expert_id: value })}
            >
              {userList.filter(u => u.role === 'expert').map(expert => (
                <Select.Option key={expert.id} value={expert.id}>{expert.real_name} ({expert.username})</Select.Option>
              ))}
            </Select>

            <Input
              placeholder="建议内容"
              style={{ width: 300 }}
              value={newSuggestion.suggestion_content}
              onChange={(e) => setNewSuggestion({ ...newSuggestion, suggestion_content: e.target.value })}
            />
            <Button type="primary" onClick={async () => {
              if (!newSuggestion.solar_term_id || !newSuggestion.crop_type || !newSuggestion.suggestion_content || !newSuggestion.expert_id) {
                message.warning('请填写完整信息');
                return;
              }
              try {
                const res = await axios.post('http://localhost:3000/api/suggestions', newSuggestion);
                if (res.data.success) {
                  message.success('建议发布成功');
                  axios.get('http://localhost:3000/api/suggestions').then(r => {
                    if (r.data.success) setSuggestions(r.data.data);
                  });
                  setNewSuggestion({ solar_term_id: '', crop_type: '', suggestion_content: '', expert_id: '' });
                }
              } catch (error) {
                message.error('发布失败，请检查后端服务');
              }
            }}>发布建议</Button>
          </div>
        </div>

        <Table
          dataSource={expertSuggestions} rowKey="id" bordered size="middle"
          columns={[
            { title: '建议编号', dataIndex: 'id', key: 'id' },
            { title: '节气', dataIndex: 'termName', key: 'termName', render: (text) => <Tag color="blue">{text}</Tag> },
            { title: '作物类型', dataIndex: 'crop_type', key: 'crop_type' },
            { title: '建议内容', dataIndex: 'suggestion_content', key: 'suggestion_content' },
            { title: '发布专家', dataIndex: 'expertName', key: 'expertName', render: (text) => <Tag color="green">{text}</Tag> },
            { title: '发布时间', dataIndex: 'created_at', key: 'created_at', render: (text) => text ? text.substring(0, 10) : '' },
            { title: '操作', key: 'action', render: (_, record) => (
              <Button danger size="small" onClick={() => handleDeleteSuggestion(record.id)}>删除</Button>
            )},
          ]}
        />
      </Card>
    );
  };

  // 🌟 修改点 5：管理员端新增“农田管理”和“访问日志审计”两个卡片
  const renderAdminPage = () => {
    const filteredUsers = userList.filter(u => roleFilter === 'all' || u.role === roleFilter);
    return (
      <div>
        <Card className="table-admin" title="管理员端 - 系统用户与权限管理" style={{ marginBottom: '20px' }}>
          <p style={{ color: '#666' }}>管理员可以在此查看系统中所有注册用户（农户、专家、管理员），并管理其权限。</p>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ marginRight: '10px' }}>角色筛选：</span>
            <Select defaultValue="all" style={{ width: 120 }} onChange={(value) => setRoleFilter(value)}>
              <Select.Option value="all">全部角色</Select.Option>
              <Select.Option value="farmer">农户</Select.Option>
              <Select.Option value="expert">专家</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
            </Select>
          </div>
          <Table
            dataSource={filteredUsers} rowKey="id" bordered size="middle"
            columns={[
              { title: '用户ID', dataIndex: 'id', key: 'id' },
              { title: '用户名', dataIndex: 'username', key: 'username' },
              { title: '角色', dataIndex: 'role', key: 'role', render: (text) => <Tag color={text === 'admin' ? 'red' : text === 'expert' ? 'blue' : 'green'}>{text === 'admin' ? '管理员' : text === 'expert' ? '专家' : '农户'}</Tag> },
              { title: '真实姓名', dataIndex: 'real_name', key: 'real_name' },
              { title: '联系电话', dataIndex: 'phone', key: 'phone', render: (text) => text ? text.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '' },
              { title: '注册时间', dataIndex: 'created_at', key: 'created_at', render: (text) => text ? text.substring(0, 10) : '' },
            ]}
          />
        </Card>

        <Card className="table-farmer" title="管理员端 - 农田管理" style={{ marginBottom: '20px' }}>
          <p style={{ color: '#666' }}>以下是系统中所有农田的基础信息（数据来源于 farmlands 表）。</p>
          <Table
            dataSource={farmlandList} rowKey="id" bordered size="middle"
            columns={[
              { title: '农田ID', dataIndex: 'id', key: 'id' },
              { title: '农户ID', dataIndex: 'farmer_id', key: 'farmer_id' },
              { title: '位置', dataIndex: 'location', key: 'location' },
              { title: '面积(亩)', dataIndex: 'area', key: 'area' },
              { title: '土壤类型', dataIndex: 'soil_type', key: 'soil_type' },
              { title: '作物类型', dataIndex: 'crop_type', key: 'crop_type' },
            ]}
          />
        </Card>

        <Card className="table-admin" title="管理员端 - 访问日志审计" style={{ marginBottom: '20px' }}>
          <p style={{ color: '#666' }}>以下是系统最近的操作日志（数据来源于 access_logs 表，按时间倒序，最多80条）。</p>
          <Table
            dataSource={accessLogs} rowKey="id" bordered size="middle"
            columns={[
              { title: '日志ID', dataIndex: 'id', key: 'id' },
              { title: '用户ID', dataIndex: 'user_id', key: 'user_id' },
              { title: '操作', dataIndex: 'action', key: 'action' },
              { title: '目标表', dataIndex: 'target_table', key: 'target_table' },
              { title: '目标ID', dataIndex: 'target_id', key: 'target_id' },
              { title: 'IP地址', dataIndex: 'ip_address', key: 'ip_address' },
              { title: '操作时间', dataIndex: 'created_at', key: 'created_at' },
            ]}
          />
        </Card>
      </div>
    );
  };

  // 渲染气象数据管理页面
  const renderDataManagePage = () => (
    <Card className="table-metdata" title="气象数据管理" style={{ marginBottom: '20px' }}>
      <p style={{ color: '#666' }}>此处集中管理所有农田的气象数据，您可以随时查看数据详情，并执行批量上链操作。</p>
      <Table
        dataSource={dataList} rowKey="id" bordered size="middle"
        columns={[
          { title: '数据编号', dataIndex: 'id', key: 'id' },
          { title: '农田编号', dataIndex: 'farmland_id', key: 'farmland_id' },
          { title: '温度(℃)', dataIndex: 'temperature', key: 'temperature', render: (text) => <Tag color={text > 30 ? 'red' : text < 10 ? 'blue' : 'green'}>{text}</Tag> },
          { title: '湿度(%)', dataIndex: 'humidity', key: 'humidity' },
          { title: '降雨量(mm)', dataIndex: 'rainfall', key: 'rainfall' },
          { title: '记录时间', dataIndex: 'record_time', key: 'record_time' },
          { title: '链上哈希', dataIndex: 'data_hash', key: 'data_hash', ellipsis: true },
          { title: '操作', key: 'action', render: (_, record) => (
            <Button danger size="small" onClick={() => handleDelete(record.id)}>删除</Button>
          )},
        ]}
      />
    </Card>
  );

  // 节气管理页面
  const renderSolarTermPage = () => (
    <Card className="table-solarterm" title="节气基础信息管理" style={{ marginBottom: '20px' }}>
      <p style={{ color: '#666' }}>以下是二十四节气基础信息（数据来源于 solar_terms 表）。</p>
      <Table
        dataSource={solarTermList} rowKey="id" bordered size="middle"
        columns={[
          { title: 'ID', dataIndex: 'id', key: 'id' },
          { title: '节气名称', dataIndex: 'term_name', key: 'term_name' },
          { title: '顺序', dataIndex: 'term_order', key: 'term_order' },
          { title: '年份', dataIndex: 'year', key: 'year' },
          { title: '开始日期', dataIndex: 'start_date', key: 'start_date', render: (text) => text ? text.substring(0, 10) : '' },
          { title: '结束日期', dataIndex: 'end_date', key: 'end_date', render: (text) => text ? text.substring(0, 10) : '' },
          { title: '描述', dataIndex: 'description', key: 'description' },
        ]}
      />
    </Card>
  );

  // 全量存证记录页面
  const renderChainPage = () => (
    <Card className="table-chain" title="区块链存证记录（全量）" style={{ marginBottom: '20px' }}>
      <p style={{ color: '#666' }}>此页面展示所有已经上链的存证记录（数据来源于 blockchain_records 表）。</p>
      <Table
        dataSource={allChainRecords} rowKey="id" bordered size="middle"
        columns={[
          { title: '交易编号', dataIndex: 'id', key: 'id' },
          { title: '数据编号', dataIndex: 'data_id', key: 'data_id' },
          { title: '交易哈希', dataIndex: 'tx_id', key: 'tx_id', ellipsis: true },
          { title: '区块号', dataIndex: 'block_number', key: 'block_number' },
          { title: '合约地址', dataIndex: 'contract_address', key: 'contract_address', ellipsis: true },
          { title: '存证时间', dataIndex: 'timestamp', key: 'timestamp', render: (text) => text ? text.substring(0, 19).replace('T', ' ') : '' },
          { title: '状态', dataIndex: 'status', key: 'status', render: (text) => <Tag color="green">{text || 'stored'}</Tag> },
        ]}
      />
    </Card>
  );

  // 同步与存证工具页面
  const renderSyncToolsPage = () => (
    <div className="table-synctools">
      <Card title="📊 数据同步概览" style={{ marginBottom: '20px' }}>
        <Row gutter={16}>
          <Col span={8}><Statistic title="气象数据总条数" value={unlinkedStats.total} suffix="条" prefix={<DatabaseOutlined />} /></Col>
          <Col span={8}><Statistic title="已上链条数" value={unlinkedStats.linked} suffix="条" prefix={<SafetyCertificateOutlined />} /></Col>
          <Col span={8}><Statistic title="未上链条数" value={unlinkedStats.unlinked} suffix="条" prefix={<SyncOutlined />} /></Col>
        </Row>
      </Card>
      <Card title="🛠️ 存证工具" style={{ marginBottom: '20px' }}>
        <p>点击下方按钮，将数据库中未上链的气象数据批量同步到 Hyperledger Fabric 区块链。</p>
        <Button type="primary" icon={<CloudOutlined />} onClick={handleSyncAll} loading={isSyncing} disabled={isSyncing} style={{ backgroundColor: '#166534', borderColor: '#166534', marginBottom: '16px' }}>
          批量同步上链
        </Button>
        <Button type="default" icon={<SafetyCertificateOutlined />} onClick={handleStore} style={{ marginLeft: '16px', borderColor: '#22c55e', color: '#166534' }}>
          模拟传感器存证（单条）
        </Button>
      </Card>
    </div>
  );

  // 动态渲染顶部菜单
  const renderTopMenuItems = () => {
    if (siderKey === '1') {
      return (
        <>
          <Menu.Item key="dashboard">数据大屏</Menu.Item>
          <Menu.Item key="farmer">农户端</Menu.Item>
          <Menu.Item key="expert">专家端</Menu.Item>
          <Menu.Item key="admin">管理员端</Menu.Item>
        </>
      );
    } else if (siderKey === '2') {
      return (
        <>
          <Menu.Item key="met_data">气象数据列表</Menu.Item>
          <Menu.Item key="solar_term">节气管理</Menu.Item>
        </>
      );
    } else if (siderKey === '3') {
      return (
        <>
          <Menu.Item key="chain_records">全量存证记录</Menu.Item>
          <Menu.Item key="sync_tools">同步与存证工具</Menu.Item>
        </>
      );
    }
    return null;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, display: 'flex', alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ color: '#0f172a', fontSize: '20px', fontWeight: 'bold', marginRight: '30px' }}>
          <div className="header-title">
            <CloudOutlined /> 二十四节气智慧农业存证系统
          </div>
        </div>
        <Menu theme="light" mode="horizontal" selectedKeys={[activeMenu]} onClick={(e) => setActiveMenu(e.key)} style={{ flex: 1, minWidth: 0, background: 'transparent' }}>
          {renderTopMenuItems()}
        </Menu>
      </Header>
      <Layout>
        <Sider width={200} theme="light" style={{ position: 'fixed', left: 0, top: 64, bottom: 0, overflow: 'auto', height: 'calc(100vh - 64px)', zIndex: 999 }}>
          <Menu mode="inline" selectedKeys={[siderKey]} onClick={handleSiderClick} style={{ height: '100%', borderRight: 0 }}
            items={[
              { key: '1', icon: <DashboardOutlined />, label: '系统首页' },
              { key: '2', icon: <CloudOutlined />, label: '气象数据管理' },
              { key: '3', icon: <SafetyCertificateOutlined />, label: '区块链存证' },
            ]}
          />
        </Sider>
        <Layout className={`app-bg-${siderKey}`} style={{ padding: '0 24px 24px', marginLeft: 200, marginTop: 64, minHeight: 'calc(100vh - 64px)', display: 'flex', flexdirection: 'column' }}>
          <Content className={`content-bg-${siderKey}`} style={{ padding: 24, margin: 0, flex: 1 }}>
            {activeMenu === 'dashboard' && renderDashboard()}
            {activeMenu === 'farmer' && renderFarmerPage()}
            {activeMenu === 'expert' && renderExpertPage()}
            {activeMenu === 'admin' && renderAdminPage()}
            {activeMenu === 'met_data' && renderDataManagePage()}
            {activeMenu === 'solar_term' && renderSolarTermPage()}
            {activeMenu === 'chain_records' && renderChainPage()}
            {activeMenu === 'sync_tools' && renderSyncToolsPage()}
          </Content>
          <Footer style={{ textAlign: 'center', background: 'rgba(0, 0, 0, 0.45)', padding: '16px 0', color: '#ffffff', fontWeight: 'bold', marginTop: '16px', position: 'relative', zIndex: 1 }}>基于Fabric的“二十四节气”传统农耕气象数据存证与智慧农业联动系统 ©2026</Footer>
        </Layout>

      </Layout>

    </Layout>
  );
}

export default App;