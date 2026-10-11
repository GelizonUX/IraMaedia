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
