import { useEffect, useRef, useState } from 'react';
import { Focus, X, Search } from 'lucide-react';
import { equipment, floors, type Equipment } from './data';
import { catalogSource } from './catalog';
import { useTwin } from './store';

export function MeasurementList({ item }: { item: Equipment }) {
  const [query, setQuery] = useState('');
  const points = item.points.filter(p => `${p.code} ${p.name}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="measurement-list">
    <div className="catalog-section-title"><h3>测点明细</h3><span>{item.points.length} 条原表记录</span></div>
    <label className="catalog-search"><Search size={15}/><input aria-label="筛选设备测点" placeholder="搜索测点编码或名称" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    {item.points.length === 0 ? <p className="empty">原表未列测点，未自动补造。</p> : <div className="point-table-wrap"><table className="point-table"><thead><tr><th>测点编码</th><th>测点名称</th><th>采集值</th><th>来源 / 核对</th></tr></thead><tbody>
      {points.map(p=><tr key={p.id}><td><code>{p.code || '编码待补充'}</code></td><td>{p.name || '名称未填写'}</td><td className="muted">未接入</td><td>第 {p.sourceRow} 行{!p.code && <em>编码缺失</em>}{p.duplicateCode && <em>原表重复编码，保留关联</em>}</td></tr>)}
    </tbody></table>{!points.length && <p className="empty">没有匹配的测点</p>}</div>}
    <p className="source-line">标准值、上限值、下限值均按原表作为独立测点保留；空白不代表零。</p>
  </section>;
}
export default function EquipmentDetails({item}: {item:Equipment}) {
  const s=useTwin();
  const dialog=useRef<HTMLDialogElement>(null);
  const close=()=>s.set({inspection:null});
  useEffect(()=>{ const el=dialog.current; el?.showModal(); return ()=>el?.close(); },[]);
  const relatives=equipment.filter(e=>e.line===item.line && e.mainRow===item.mainRow && e.id!==item.id);
  return <dialog ref={dialog} className="equipment-dialog" aria-labelledby="equipment-dialog-title" onCancel={close} onClick={e=>{if(e.target===e.currentTarget)close();}}>
    <div className="equipment-dialog-content">
      <header className="modal-title"><div><span className="eyebrow">设备详情 · {item.sourceSheet} · {item.isMain?'主设备':'配套设备'}</span><h2 id="equipment-dialog-title">{item.name}</h2><p>{item.tag || '原表未填写设备位号'} <span className="muted"> / {item.id}</span></p></div><button autoFocus className="icon-button" aria-label="关闭设备详情弹窗" onClick={close}><X/></button></header>
      <div className="catalog-location"><span>前纺结构塔楼 · {floors.find(f=>f.id===item.floor)?.label} · {item.process}</span><button onClick={()=>s.locate(item.id)}><Focus size={15}/>定位此设备</button></div>
      <p className="catalog-disclaimer">设备及测点来自原表；三维外形、楼层分配和位置为 DEMO 布置。查看详情不会移动场景。</p>
      <div className="catalog-fields">
        <div><span>工艺段</span><strong>{item.stage}</strong></div><div><span>主设备名称</span><strong>{item.mainName}</strong></div>
        <div><span>原表数量</span><strong>{item.quantity || '未填写'}</strong></div><div><span>型号规格</span><strong>{item.fields['型号规格'] || '未填写'}</strong></div>
        <div><span>主要技术参数</span><strong>{item.fields['主要技术参数'] || '未填写'}</strong></div><div><span>运行状态</span><strong>未接入实时采集（场景状态为演示）</strong></div>
      </div>
      <MeasurementList key={item.id} item={item}/>
      <section className="catalog-parameters"><h3>工艺与运行依据</h3>{['设计参数','对应工艺参数','对应物性指标','设备运行标准','工艺原理','备注'].map(field=><details key={field}><summary>{field}</summary><p>{item.fields[field as keyof typeof item.fields] || '原表未填写'}</p></details>)}</section>
      {!!relatives.length && <section><div className="catalog-section-title"><h3>同主设备下的设备记录</h3><span>{relatives.length} 条</span></div><div className="related-assets">{relatives.map(e=><button key={e.id} onClick={()=>s.inspect(e.id)}>{e.name}<small>{e.tag || '位号未填写'} · {e.points.length} 测点</small></button>)}</div></section>}
      <p className="source-line">来源：{catalogSource.filename} / {item.sourceSheet} / 第 {item.sourceRow}–{item.sourceEndRow} 行。数量和位号范围按原文保留，不推算单台测点对应关系。</p>
    </div>
  </dialog>;
}
