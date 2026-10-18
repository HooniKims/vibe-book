"""Teacher-prepared example, Python standard library only.
Usage: python generate_report.py scores.csv report.html
The input is read only. No network access or packages are required.
"""
from pathlib import Path
import csv, html, math, sys

def read_scores(path):
    with Path(path).open(encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f)
        if reader.fieldnames != ['과목','시험1','시험2','시험3']:
            raise ValueError('열 이름은 과목,시험1,시험2,시험3이어야 합니다.')
        rows=[]
        for row in reader:
            if None in row:raise ValueError('열 개수가 맞지 않습니다.')
            name=(row['과목'] or '').strip()
            if not name:raise ValueError('과목명이 없습니다.')
            values=[]
            for col in ['시험1','시험2','시험3']:
                raw=row[col]
                if raw is None:raise ValueError('열이 빠졌습니다. 자료가 없는 값은 빈칸으로 두세요.')
                raw=raw.strip()
                if raw=='':values.append(None);continue
                try:v=float(raw)
                except ValueError:raise ValueError(f'{name} {col}: 숫자가 아닙니다.')
                if not math.isfinite(v) or not 0<=v<=100:raise ValueError(f'{name} {col}: 0~100 범위가 아닙니다.')
                values.append(v)
            rows.append((name,values))
        if not rows:raise ValueError('점수 자료가 없습니다.')
        if len({r[0] for r in rows})!=len(rows):raise ValueError('과목명이 중복됐습니다.')
        return rows

def render(rows):
    parts=['<rect width="720" height="390" fill="#f4f6ee" rx="12"/>']
    for tick in range(0,101,20):
        y=310-tick*2.5
        parts.append(f'<path d="M75 {y}H660" stroke="#d5dfcf"/><text x="58" y="{y+5}" text-anchor="end" font-size="16">{tick}</text>')
    for x,t in zip([140,360,580],['시험1','시험2','시험3']):parts.append(f'<text x="{x}" y="345" text-anchor="middle" font-size="18">{t}</text>')
    table=[];legends=[]
    for i,(name,values) in enumerate(rows):
        color=['#28644c','#b6543b','#335b9a','#824a91'][i%4];dash='8 5' if i%2 else 'none'
        points=[None if v is None else (x,310-v*2.5) for x,v in zip([140,360,580],values)]
        for j in range(2):
            if points[j] and points[j+1]:parts.append(f'<path d="M{points[j][0]} {points[j][1]}L{points[j+1][0]} {points[j+1][1]}" stroke="{color}" stroke-width="3" stroke-dasharray="{dash}" fill="none"/>')
        for point,v in zip(points,values):
            if point:parts.append(f'<circle cx="{point[0]}" cy="{point[1]}" r="6" fill="{color}"/><text x="{point[0]+10}" y="{point[1]-10}" font-size="18" fill="{color}">{v:g}</text>')
        delta='계산 불가' if values[0] is None or values[-1] is None else f'{values[-1]-values[0]:+g}점'
        table.append('<tr><th>'+html.escape(name)+'</th>'+''.join('<td>'+('자료 없음' if v is None else f'{v:g}')+'</td>' for v in values)+'<td>'+delta+'</td></tr>')
        legends.append(f'<span style="color:{color}">{"┄" if i%2 else "━"} {html.escape(name)}</span>')
    return '''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>가상 원점수 보고서</title><style>
    *{box-sizing:border-box}body{margin:0;background:#e8e8df;color:#202824;font-family:system-ui,sans-serif;line-height:1.7}main{max-width:820px;margin:30px auto;padding:30px;background:#fffdf7;border-radius:12px}h1{font-size:30px;margin:.4em 0}.tag{color:#28644c;font-size:14px}svg{width:100%;height:auto}table{border-collapse:collapse;width:100%;margin:20px 0}th,td{padding:12px;border-bottom:1px solid #d4d8cd;text-align:center}.legend{display:flex;gap:24px;font-weight:700}small{color:#68746c}@media(max-width:600px){main{margin:0;padding:22px}h1{font-size:25px}th,td{padding:8px;font-size:14px}}@media print{main{margin:0}a{display:none}}</style><main><div class="tag">요즘 바이브코딩 · 강사가 준비한 가상 자료 예시</div><h1>내 점수의 변화, 무엇을 더 볼까요?</h1><p>100점 만점의 가상 원점수입니다. 빈칸은 자료 없음으로 표시하며, 빈 구간을 연결하지 않습니다.</p>'''+'<svg viewBox="0 0 720 390" role="img" aria-label="과목별 원점수 그래프. 정확한 값은 아래 표에 있습니다.">'+''.join(parts)+'</svg><div class="legend">'+''.join(legends)+'</div><table><thead><tr><th>과목</th><th>시험1</th><th>시험2</th><th>시험3</th><th>처음→마지막</th></tr></thead><tbody>'+''.join(table)+'''</tbody></table><p><b>먼저 확인:</b> 숫자·시험 순서·축·빈칸 처리를 원자료와 대조하세요.</p><p>시험 난도와 범위가 다를 수 있어 점수 차이만으로 실력이나 합격 가능성을 단정할 수 없어요. 오답 유형과 공부 과정을 함께 살펴 다음 계획을 정하세요.</p><p><a href="scores.csv">원자료 CSV</a> · <a href="report-gap.html">빈칸 예제</a> · <a href="report.html">기본 예제</a> · <a href="../index.html">전자책으로</a></p><small>이 파일은 강사가 준비한 예시입니다. 여러분의 요청으로 생성한 코드의 정확성은 별도로 확인하세요.</small></main></html>'''

if __name__=='__main__':
    source=Path(sys.argv[1] if len(sys.argv)>1 else 'scores.csv')
    target=Path(sys.argv[2] if len(sys.argv)>2 else 'report.html')
    if source.resolve()==target.resolve():raise ValueError('원자료를 덮어쓸 수 없습니다.')
    target.write_text(render(read_scores(source)),encoding='utf-8')
    print(target)
