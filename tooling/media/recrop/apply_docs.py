import json,subprocess
T=open("/tmp/jarl_admin_token").read().strip()
m=json.load(open("recrop/meta.json"))
# resolve hosted urls from the media library
r=subprocess.run(["bp","-s","https://jarl.barkpark.cloud","--token",T,"media","ls","--limit","80"],
                 capture_output=True,text=True,stdin=subprocess.DEVNULL)
assets={w.get("mediaFileId") or w["asset"]["mediaFileId"]: w["asset"]["fileInfo"]["url"] for w in json.loads(r.stdout)["assets"]}
urls={}
for k,v in m.items():
    src=assets[v["asset"]]
    urls[k]=src
    img={"src":src,"width":1440,"height":586,"alt":v["alt"],"caption":v["cap"]}
    p=subprocess.run(["bp","-s","https://jarl.barkpark.cloud","--token",T,"--yes","doc","patch","project",v["doc"],
                      "--set","image:="+json.dumps(img,ensure_ascii=False)],
                     capture_output=True,text=True,stdin=subprocess.DEVNULL)
    pub=subprocess.run(["bp","-s","https://jarl.barkpark.cloud","--token",T,"--yes","doc","publish","project",v["doc"]],
                       capture_output=True,text=True,stdin=subprocess.DEVNULL)
    print(f'{k:22s} patch={p.returncode} publish={pub.returncode}  {src}')
    if p.returncode or pub.returncode:
        print("   ", (p.stdout+p.stderr+pub.stdout+pub.stderr)[:300])
json.dump(urls,open("recrop/urls.json","w"),indent=1)
