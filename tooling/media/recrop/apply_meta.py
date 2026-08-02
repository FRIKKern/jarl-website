import json,subprocess,sys
T=open("/tmp/jarl_admin_token").read().strip()
m=json.load(open("recrop/meta.json"))
for k,v in m.items():
    r=subprocess.run(["bp","-s","https://jarl.barkpark.cloud","--token",T,"--yes","media","update",v["asset"],
                      "--set",f'altText={v["alt"]}',"--set",f'caption={v["cap"]}'],
                     capture_output=True,text=True,stdin=subprocess.DEVNULL)
    print(k, r.returncode, (r.stdout or r.stderr).strip()[:200])
