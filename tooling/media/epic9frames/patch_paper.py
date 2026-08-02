import json, subprocess, os
TOKEN = open("/tmp/jarl_admin_token").read().strip()
D = os.path.dirname(os.path.abspath(__file__))
body = json.load(open(f"{D}/patch-scaffy-historien.json"))
arg = "blocks:=" + json.dumps(body["blocks"], ensure_ascii=False)
base = ["bp", "-s", "jarl", "--token", TOKEN, "--yes"]
devnull = subprocess.DEVNULL
r = subprocess.run(base + ["doc", "patch", "paper", "scaffy-historien", "--set", arg],
                   capture_output=True, text=True, stdin=devnull)
print("patch:", (r.stdout or r.stderr).strip()[:300])
r = subprocess.run(base + ["doc", "publish", "paper", "scaffy-historien"],
                   capture_output=True, text=True, stdin=devnull)
print("publish:", (r.stdout or r.stderr).strip()[:300])
