import { StubCanvas } from "../ModuleCanvas";

export default function LibraryCanvas() {
  return (
    <StubCanvas
      icon="📚"
      title="Library"
      tagline="The unified learning content layer. One search across every source you already pay for — Drive, Confluence, Slack, Coursera, LinkedIn Learning, your internal LMS. Goal-anchored paths from real content, not just LinkedIn's catalog."
      comingSoon="A real search box (not a chat round-trip), source connector status panel, and a coverage-by-skill-cluster heatmap so L&D can answer 'what does my org have on Kubernetes' in seconds. Manager view: 'what does my team have access to?'"
      paneHint="View connected sources, connect more, and run a Drive index from the left pane. Use Peraasan chat (button at the bottom right) to search semantically across your indexed content."
    />
  );
}
