import json, os, glob, re

BASE = os.path.dirname(os.path.abspath(__file__))
EVALS = ["safe-roam", "ecommerce-mvp", "team-todo"]

def check_assertion(rule, dirpath):
    name = rule["name"]
    text = rule["text"]
    ttype = rule["type"]
    
    if ttype == "file_exists":
        pattern = os.path.join(dirpath, rule["target"])
        files = glob.glob(pattern)
        passed = len(files) > 0
        evidence = f"Found {len(files)} matching files: {[os.path.basename(f) for f in files]}" if passed else f"No files matching {rule['target']}"
        return {"text": text, "passed": passed, "evidence": evidence}
    
    elif ttype == "content_check":
        targets = rule["target"] if isinstance(rule["target"], list) else [rule["target"]]
        found_terms = []
        all_files_content = ""
        
        md_files = glob.glob(os.path.join(dirpath, "*.md"))
        json_files = glob.glob(os.path.join(dirpath, "*.json"))
        prisma_files = glob.glob(os.path.join(dirpath, "*.prisma"))
        
        content = ""
        for f in md_files + json_files + prisma_files:
            try:
                content += open(f, "r", errors="ignore").read().lower() + "\n"
            except: pass
            all_files_content = content
        
        for term in targets:
            if term.lower() in all_files_content:
                found_terms.append(term)
        
        passed = len(found_terms) >= (len(targets) * 0.6)
        missing = [t for t in targets if t not in found_terms]
        evidence = f"Found {len(found_terms)}/{len(targets)} terms. Found: {found_terms[:5]}" if passed else f"Missing: {missing[:5]}"
        return {"text": text, "passed": passed, "evidence": evidence}

results = {}

for eval_name in EVALS:
    results[eval_name] = {}
    meta_path = os.path.join(BASE, eval_name, "eval_metadata.json")
    meta = json.load(open(meta_path))
    assertions = meta["assertions"]
    
    for variant in ["with_skill", "without_skill"]:
        output_dir = os.path.join(BASE, eval_name, variant, "outputs")
        if not os.path.isdir(output_dir):
            results[eval_name][variant] = {"error": "no output dir"}
            continue
        
        grades = []
        for a in assertions:
            # Skip orchestrator check for without_skill
            if variant == "without_skill" and a["type"] == "file_exists" and "orchestrator" in a.get("target", ""):
                grades.append({"text": a["text"], "passed": False, "evidence": "Skipped: orchestrator plan not expected for baseline"})
                continue
            result = check_assertion(a, output_dir)
            grades.append(result)
        
        # Read timing
        timing_path = os.path.join(output_dir, "timing.json")
        timing = {}
        if os.path.exists(timing_path):
            timing = json.load(open(timing_path))
        
        results[eval_name][variant] = {
            "grades": grades,
            "passed": sum(1 for g in grades if g["passed"]),
            "total": len(grades),
            "timing": timing
        }

print(json.dumps(results, indent=2))

# Save grading results
for eval_name in EVALS:
    for variant in ["with_skill", "without_skill"]:
        fpath = os.path.join(BASE, eval_name, variant, "grading.json")
        with open(fpath, "w") as f:
            json.dump({"eval_name": eval_name, "variant": variant, "expectations": results[eval_name][variant]["grades"], "summary": {"passed": results[eval_name][variant]["passed"], "total": results[eval_name][variant]["total"]}}, f, indent=2)

print("\n--- Grading saved to grading.json files ---")
