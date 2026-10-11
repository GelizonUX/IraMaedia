import json,sys
d=json.load(open(sys.argv[1]))['checks']
st=d.get('static',{})
print('TITLE',st.get('title'),'| lang',st.get('lang'),'| desc',bool(st.get('metaDesc')),'| favicon',st.get('favicon'),'| og',st.get('ogImage'))
print('HEADINGS'); [print('  ',h) for h in st.get('headings',[])]
for k in ['headingSkips','h1Count','landmarks','skipLink','imgNoAlt','imgCount','svgNoLabel','rootAbsoluteUrls','emptyLinks','badHref','blankNoRel','brokenAnchors','unnamedButtons','unlabeledInputs','duplicateIds','junk','doubleWords']:
    print(k,':',st.get(k))
print('LOCAL LINKS',d.get('localLinkStatus')); print('EXTERNAL',d.get('externalLinks'))
print('CONTRAST FAILS',len(d.get('contrast',[])))
for c in d.get('contrast',[])[:25]: print('  ',c)
seen=set();print('FOCUS (no visible indicator):')
for f in d.get('focus',[]):
    k=(f['tag'],f['text'],f['href'])
    if k in seen: continue
    seen.add(k)
    if not (f['outline'] or f['shadow']): print('  ',f)
print('  focus stops:',len(seen))
print('FAQ',d.get('faq')); print('FORM',d.get('form'))
for k,v in d.items():
    if '-' in k and k.split('-')[0] in('root','sub'):
        v=dict(v); ov=v.pop('overflow'); inv=v.pop('invisibleAfterScroll')
        print('==',k,'status',v.get('status'),'load',v.get('loadMs'),'ms CLS',v.get('clsDuringScroll'),'LCP',v.get('lcpMs'),'KB local/ext',v.get('kbLocal'),v.get('kbExternal'),'reqs',v.get('requestCount'))
        print('   overflow',ov['overflow'],ov['scrollWidth'],ov['clientWidth'],ov['offenders'][:6])
        print('   invisible after scroll',len(inv),inv[:8], '| before scroll',v.get('invisibleBeforeScroll'))
        for kk in ['console','pageErrors','failed','http','externalHosts','mobileNav','overflowAfterNav','runningAnimations']:
            if kk in v: print('  ',kk,v[kk] if kk!='overflowAfterNav' else (v[kk]['overflow'],v[kk]['offenders'][:4]))
print('REDUCED MOTION',json.dumps(d.get('reducedMotion'))[:2000])
print('NOJS',d.get('noJS'))
print('EXTRA WIDTHS',{k:(v['overflow'],v['scrollWidth'],v['offenders'][:5],'invis',v['invisible']) for k,v in d.get('extraWidths',{}).items()})
print('ANCHOR JUMPS'); [print('  ',k,v) for k,v in d.get('anchorJumps',{}).items()]

# ================= Round 3+ sections =================
from collections import Counter, defaultdict
def H(t): print('\n######## ' + t)
rd = d.get('readability')
if rd:
    H('READABILITY')
    for w, v in rd.items():
        print(f"[{w}] body={v['bodyFam']} display={v['h1Fam']} textNodes={v['textNodes']} min body/label/display = {v['minBody']}/{v['minLabel']}/{v['minDisplay']}")
        print('   fonts loaded:', v['fontsLoaded'])
        print('   flag counts:', dict(Counter((f['sev'], f['rule'].split(' ')[0] + ' ' + (f['rule'].split(' ')[1] if ' ' in f['rule'] else '')) for f in v['flags'])))
        for f in sorted(v['flags'], key=lambda f: ['Medium', 'Check', 'Low', 'Info'].index(f['sev']) if f['sev'] in ['Medium', 'Check', 'Low', 'Info'] else 9):
            if f['sev'] == 'Info' and 'AAA' in f['rule']: continue
            print(f"   {f['sev']:6} {f['rule']:28} x{f['count']:<3} {f['size']}px w{f['weight']} {f['family'][:16]} {f['style']} {f['color']} on {f['bg']} | {f['where'][:110]}")
        aaa = [f for f in v['flags'] if 'AAA' in f['rule']]
        print(f'   Info body-not-AAA: {len(aaa)} groups', [ (f['ratio'], f['where'][:60]) for f in aaa[:8]])
        # real backdrop sampling for gradient/image bg failures
        try:
            from PIL import Image
            def lum(c):
                f = lambda v: (v/255)/12.92 if v/255 <= 0.03928 else (((v/255)+0.055)/1.055)**2.4
                return 0.2126*f(c[0]) + 0.7152*f(c[1]) + 0.0722*f(c[2])
            import re as _re
            for c in v.get('clips', []):
                if 'file' not in c: print('   clip err', c); continue
                im = Image.open(c['file']).convert('RGB'); px = list(im.getdata())
                m = _re.findall(r'[\d.]+', c['color']); fg = tuple(float(x) for x in m[:3]); a = float(m[3]) if len(m) > 3 else 1
                ratios = []
                for p in px[::max(1, len(px)//400)]:
                    f2 = tuple(fg[i]*a + p[i]*(1-a) for i in range(3)); L1, L2 = lum(f2), lum(p)
                    ratios.append((max(L1, L2)+.05)/(min(L1, L2)+.05))
                ratios.sort()
                print(f"   CLIP {c['where'][:70]} worst={ratios[0]:.2f} p10={ratios[len(ratios)//10]:.2f} median={ratios[len(ratios)//2]:.2f} ({c['size']}px)")
        except Exception as e: print('   clip sampling error', e)
pl = d.get('preloader')
if pl:
    H('PRELOADER')
    for k, v in pl.items():
        if k.startswith('nojs') or k.startswith('skiplink'): print(' ', k, json.dumps(v)[:600]); continue
        print(f"  {k:28} DCL={v.get('domContentLoaded')} firstBlocked={v.get('firstBlockedAt')} unblocked={v.get('unblockedAt')} heroVisible={v.get('heroVisibleAt')} nowBlocked='{v.get('nowBlocked')}' by={v.get('blockedBy')} errs={v.get('pageErrors')}")
        print('       transitions:', v.get('transitions')[:8], '| html:', v.get('htmlClass'))
        if v.get('reload'): print('       reload:', v['reload'])
        if v.get('candidates'): print('       el:', v['candidates'][:2])
sc = d.get('scroll')
if sc:
    H('SCROLL / ANCHORS / FOCUS / PIN')
    for k, v in sc.items():
        if k.startswith('hash'): print(' ', k, v); continue
        print(f'  == {k}  errors={v.get("pageErrors")}')
        for a in v.get('anchors', []):
            bad = (not a.get('landed')) or a.get('headingUnderHeader') or a.get('invisibleCount') or not a.get('focusInTarget') or not a.get('hashOk')
            print(f"    {'XX' if bad else 'ok'} {a['href']:16} {a['how']:5} landed={a.get('landed')} secTop={a.get('targetTop')} headTop={a.get('headingTop')} hdr={a.get('headerBottom')} focusIn={a.get('focusInTarget')} hash={a.get('hashOk')} settle={a.get('settleMs')} invis={a.get('invisibleCount')} {a.get('invisibleInView') or ''}")
        fo = v.get('focus')
        if fo:
            print(f"    focus stops={fo['stops']} problems={len(fo['problems'])}")
            for p in fo['problems'][:15]: print('      ', {k2: p[k2] for k2 in ['desc', 'rect', 'inView', 'covered', 'coveredBy', 'opacity', 'hidden', 'ring', 'headerBottom', 'bottomBar']})
        pn = v.get('pin')
        if pn:
            print(f"    pins={pn['pins']} sticky={pn['sticky'][:4]} lenis={pn['lenis']} gsap={pn['gsap']} ST={pn['scrollTrigger']} steps={pn['steps']} reachedBottom={pn['reachedBottom']} gaps={pn['gapsAtY']} overflowAt={pn['overflowAtY']}")
            for t in pn['trackSummary']: print('     track', t)
            for o in pn['crossSectionOverlaps']: print('     OVERLAP', o)
            for o in pn['intraSectionOverlaps'][:6]: print('     intra', o)
            print('     frames', pn['frames'])
        for kk in ['keyboard', 'stackCards', 'menuLock', 'bottomBar', 'sectionBgs']:
            if kk in v: print(f'    {kk}:', json.dumps(v[kk])[:900])
vf = d.get('vendorFailure')
if vf:
    H('VENDOR/CDN FAILURE')
    for k, v in vf.items():
        t = v['timeline']
        print(f"  {k} blocked={v['blocked']} firstBlocked={t['firstBlockedAt']} unblocked={t['unblockedAt']} nowBlocked='{t['nowBlocked']}' hero={t['heroVisibleAt']} html='{t['htmlClass']}' errs={v['pageErrors'][:3]} console={v['consoleErrors'][:3]}")
        if 'invisibleAfterScroll' in v:
            print(f"     invisible before/after={v['invisibleBeforeScroll']}/{len(v['invisibleAfterScroll'])} {v['invisibleAfterScroll'][:4]} overflow={v['overflow']} anchorsBad={[a for a in v['anchors'] if not a['landed'] or a['invisibleCount']]}")
            print('     sectionBgs nonSolid', v.get('sectionBgs', {}).get('nonSolid'), 'pins', v.get('sectionBgs', {}).get('pins'))
            if 'form' in v: print('     form', json.dumps(v['form'])[:400])
            if 'mobileNav' in v: print('     nav', json.dumps(v['mobileNav'])[:400])
fv = d.get('formV2')
if fv:
    H('FORM V2')
    for k, v in fv.items(): print(' ', k, json.dumps(v)[:1500])
pf = d.get('perf')
if pf:
    H('PERF')
    for p in pf: print(' ', json.dumps(p)[:900])
if d.get('screens'): H('SCREENS'); print(d['screens'])
