import re

# Read the HTML content
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's write script imports
script_tags = """
    // Load externalised game stages modules
    </script>
    <script type="text/babel" src="stage1.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage2.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage3.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage4.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage5.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage6.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="stage7.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel" src="PuzzleMap.js" data-plugins="transform-react-jsx"></script>
    <script type="text/babel">
"""

start_anchor = 'const synth = new AudioSynth();'
end_anchor = 'function App() {'

start_idx = html.find(start_anchor)
end_idx = html.find(end_anchor)

if start_idx != -1 and end_idx != -1:
    cut_start = start_idx + len(start_anchor)
    new_html = html[:cut_start] + script_tags + html[end_idx:]
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print("SUCCESS: index.html has been cleanly modularized!")
else:
    print("ERROR: Anchors not found!")
