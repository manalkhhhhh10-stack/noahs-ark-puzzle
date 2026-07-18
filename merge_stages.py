import os

# Read the sliced JS files
with open('stage1.js', 'r', encoding='utf-8') as f:
    stage1 = f.read()

with open('stage2.js', 'r', encoding='utf-8') as f:
    stage2 = f.read()

with open('stage3.js', 'r', encoding='utf-8') as f:
    stage3 = f.read()

with open('stage4.js', 'r', encoding='utf-8') as f:
    stage4 = f.read()

with open('stage5.js', 'r', encoding='utf-8') as f:
    stage5 = f.read()

with open('stage6.js', 'r', encoding='utf-8') as f:
    stage6 = f.read()

with open('stage7.js', 'r', encoding='utf-8') as f:
    stage7 = f.read()

with open('PuzzleMap.js', 'r', encoding='utf-8') as f:
    puzzle_map = f.read()

# Read the cleanly modularized HTML template
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the script tags block back with all component sources inline
target_import_block = """    // Load externalised game stages modules
    </script>
    <script type="text/babel" src="stage1.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage2.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage3.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage4.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage5.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage6.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage7.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="PuzzleMap.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel">"""

merged_stages_code = f"\n\n{stage1}\n\n{stage3}\n\n{stage4}\n\n{stage2}\n\n{stage5}\n\n{stage6}\n\n{stage7}\n\n{puzzle_map}\n\n"

# Verify if target exists and replace
if target_import_block in html:
    new_html = html.replace(target_import_block, merged_stages_code)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print("SUCCESS: Cleanly merged all stages back into index.html!")
else:
    # Try finding simplified tags
    simplified_block = """    // Load externalised game stages modules
    </script>
    <script type="text/babel" src="stage1.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage2.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage3.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage4.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage5.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage6.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage7.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="PuzzleMap.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel">"""
    
    # Try finding normal script declarations
    import re
    patt = r'// Load externalised game stages.*?</script>\s*<script type="text/babel">'
    if re.search(patt, html, re.DOTALL):
        new_html = re.sub(patt, merged_stages_code, html, flags=re.DOTALL)
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(new_html)
        print("SUCCESS: Cleanly merged stages with regex!")
    else:
        print("ERROR: Import script tags not found in index.html!")
