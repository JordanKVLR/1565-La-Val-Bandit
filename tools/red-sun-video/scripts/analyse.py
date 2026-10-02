"""Offline audio analysis -> src/audioData.json (per-frame energy, beat grid, drum hits).
Run: npm run analyse   (needs ffmpeg + python3 + numpy)"""
import json, subprocess, sys, os, numpy as np
FPS = 30
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp3 = os.path.join(root, "public", "red-sun.mp3")
raw = subprocess.run(["ffmpeg","-v","error","-i",mp3,"-ac","1","-ar","22050","-f","f32le","-"],capture_output=True,check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).astype(float); sr = 22050
dur = len(x)/sr
hop = int(sr/100); N = 2048; win = np.hanning(N)
spec = np.array([np.abs(np.fft.rfft(x[i:i+N]*win)) for i in range(0, len(x)-N, hop)])
f = np.fft.rfftfreq(N, 1/sr)
def band(lo, hi): return np.log1p(spec[:, (f>=lo)&(f<hi)]*10).sum(1)
low, mid = band(30,160), band(160,2000)
def flux(b): return np.maximum(np.diff(b, prepend=b[0]), 0)
fl = flux(low); fm = flux(mid)
# beat grid: search bpm & offset
best = (0, 130, 0)
for bpm in np.arange(124, 136, 0.1):
    per = 6000/bpm  # centi-seconds per beat
    for off in np.arange(0, per, 1):
        idx = (off + per*np.arange(int((len(fl)-off)/per))).astype(int)
        s = fl[idx].sum() + 0.3*fm[idx].sum()
        if s > best[0]: best = (s, bpm, off)
_, bpm, off = best
beat = 60/bpm; first = off/100
beats = [round(first + i*beat, 3) for i in range(int((dur-first)/beat))]
# drum hits: peaks in low flux above adaptive threshold
thr = np.convolve(fl, np.ones(100)/100, 'same')*3.2 + 0.15
hits = []
for i in range(2, len(fl)-2):
    if fl[i] > thr[i] and fl[i] >= fl[i-2:i+3].max() and (not hits or i/100-hits[-1][0] > 0.2):
        hits.append((i/100, float(fl[i])))
m = max(h[1] for h in hits)
drums = [[round(t,3), round(v/m,3)] for t, v in hits if v/m > 0.3]
# per-frame envelopes
nf = int(dur*FPS)
def env(a):
    out = []
    for k in range(nf):
        s = int(k/FPS*100); e = max(s+1, int((k+1)/FPS*100)); out.append(a[s:e].mean())
    out = np.array(out)
    return out
rms = np.array([np.sqrt((x[int(k/FPS*sr):int((k+1)/FPS*sr)]**2).mean()) for k in range(nf)])
# smooth, normalise with 1s window
sm = np.convolve(rms, np.ones(15)/15, 'same'); sm = sm/sm.max()
lowe = env(low); lowe = (lowe-lowe.min())/(lowe.max()-lowe.min())
json.dump({"fps":FPS,"duration":round(dur,3),"bpm":round(float(bpm),2),"beats":beats,"drums":drums,
           "energy":[round(float(v),3) for v in sm],"low":[round(float(v),3) for v in lowe]},
          open(os.path.join(root,"src","audioData.json"),"w"))
print(f"dur {dur:.1f}s bpm {bpm:.1f} first beat {first:.2f}s beats {len(beats)} drum hits {len(drums)}")
