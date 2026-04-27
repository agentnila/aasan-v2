import { addContent } from '../services/api';

const DEMO_CONTENT = [
  // Cloud/Kubernetes
  {
    title: "Kubernetes Architecture Overview",
    source: "coursera",
    type: "video",
    duration_minutes: 45,
    level: "intermediate",
    url: "https://coursera.org/learn/kubernetes-architecture",
    skills: ["kubernetes", "container-orchestration", "cloud-architecture"],
    concepts_covered: ["control plane", "etcd", "kube-apiserver", "kubelet", "kube-proxy", "scheduler"],
    prerequisites: ["docker-fundamentals", "linux-basics"],
    ai_summary: "Comprehensive overview of Kubernetes architecture including control plane components, worker nodes, and how they communicate. Covers etcd, API server, scheduler, and controller manager."
  },
  {
    title: "Kubernetes Networking Deep Dive",
    source: "coursera",
    type: "video",
    duration_minutes: 35,
    level: "intermediate",
    url: "https://coursera.org/learn/kubernetes-networking",
    skills: ["kubernetes", "networking", "service-mesh"],
    concepts_covered: ["ClusterIP", "NodePort", "LoadBalancer", "Ingress", "CNI plugins", "network policies"],
    prerequisites: ["kubernetes-basics", "tcp-ip-fundamentals"],
    ai_summary: "Deep dive into Kubernetes networking model: pod-to-pod communication, Services (ClusterIP, NodePort, LoadBalancer), Ingress controllers, CNI plugins, and network policies for security."
  },
  {
    title: "Pod Security Best Practices",
    source: "confluence",
    type: "article",
    duration_minutes: 15,
    level: "advanced",
    url: "https://confluence.internal/wiki/pod-security",
    skills: ["kubernetes", "security", "devops"],
    concepts_covered: ["PodSecurityPolicy", "securityContext", "RBAC", "network policies", "image scanning"],
    prerequisites: ["kubernetes-architecture", "container-security-basics"],
    ai_summary: "Internal best practices for securing Kubernetes pods: security contexts, pod security standards, RBAC configuration, network policies, and container image scanning in our CI/CD pipeline."
  },
  {
    title: "Our Team's K8s Setup Guide",
    source: "confluence",
    type: "document",
    duration_minutes: 20,
    level: "beginner",
    url: "https://confluence.internal/wiki/team-k8s-setup",
    skills: ["kubernetes", "devops", "onboarding"],
    concepts_covered: ["kubectl setup", "namespace conventions", "helm chart usage", "deployment workflow"],
    prerequisites: [],
    ai_summary: "Step-by-step guide for new team members to set up their local Kubernetes development environment, connect to staging clusters, and deploy their first service using our Helm charts."
  },
  {
    title: "Kubernetes in 10 Minutes",
    source: "youtube",
    type: "video",
    duration_minutes: 10,
    level: "beginner",
    url: "https://youtube.com/watch?v=kubernetes-10min",
    skills: ["kubernetes", "containers"],
    concepts_covered: ["pods", "deployments", "services", "kubectl basics"],
    prerequisites: [],
    ai_summary: "Quick beginner-friendly introduction to Kubernetes core concepts: what pods are, how deployments work, exposing services, and basic kubectl commands to get started."
  },
  // AWS
  {
    title: "AWS EC2 & VPC Fundamentals",
    source: "linkedin",
    type: "video",
    duration_minutes: 40,
    level: "beginner",
    url: "https://linkedin.com/learning/aws-ec2-vpc",
    skills: ["aws", "networking", "cloud-infrastructure"],
    concepts_covered: ["EC2 instances", "VPC", "subnets", "security groups", "route tables", "internet gateway"],
    prerequisites: [],
    ai_summary: "Foundational course on AWS compute and networking: launching EC2 instances, designing VPCs with public/private subnets, configuring security groups, and setting up route tables."
  },
  {
    title: "AWS Lambda & Serverless",
    source: "coursera",
    type: "course",
    duration_minutes: 120,
    level: "intermediate",
    url: "https://coursera.org/learn/aws-lambda-serverless",
    skills: ["aws", "serverless", "cloud-architecture"],
    concepts_covered: ["Lambda functions", "API Gateway", "DynamoDB", "Step Functions", "SAM", "event-driven architecture"],
    prerequisites: ["aws-basics", "python-or-nodejs"],
    ai_summary: "Build serverless applications with AWS Lambda, API Gateway, and DynamoDB. Covers event-driven patterns, Step Functions for orchestration, and SAM for infrastructure as code."
  },
  {
    title: "IAM Policies Deep Dive",
    source: "youtube",
    type: "video",
    duration_minutes: 25,
    level: "intermediate",
    url: "https://youtube.com/watch?v=iam-deep-dive",
    skills: ["aws", "security", "iam"],
    concepts_covered: ["IAM policies", "roles", "trust policies", "permission boundaries", "SCP", "least privilege"],
    prerequisites: ["aws-basics"],
    ai_summary: "Detailed walkthrough of AWS IAM: policy structure (Effect, Action, Resource, Condition), role assumption, cross-account access, permission boundaries, and implementing least privilege."
  },
  {
    title: "AWS Solutions Architect Prep",
    source: "coursera",
    type: "course",
    duration_minutes: 480,
    level: "advanced",
    url: "https://coursera.org/learn/aws-sa-pro",
    skills: ["aws", "cloud-architecture", "high-availability", "cost-optimization"],
    concepts_covered: ["well-architected framework", "multi-region", "disaster recovery", "cost optimization", "migration strategies"],
    prerequisites: ["aws-ec2-vpc", "aws-lambda", "iam-policies", "networking-fundamentals"],
    ai_summary: "Comprehensive prep for the AWS Solutions Architect Professional exam. Covers Well-Architected Framework, multi-region architectures, disaster recovery patterns, cost optimization, and migration strategies."
  },
  {
    title: "Internal: AWS Account Setup Guide",
    source: "drive",
    type: "document",
    duration_minutes: 10,
    level: "beginner",
    url: "https://drive.google.com/file/aws-account-setup",
    skills: ["aws", "onboarding"],
    concepts_covered: ["SSO login", "account structure", "billing tags", "approved regions"],
    prerequisites: [],
    ai_summary: "Internal guide for accessing our AWS organization: SSO setup, account structure (dev/staging/prod), required billing tags, approved regions, and how to request new resources."
  },
  // DevOps/Infrastructure
  {
    title: "Docker Fundamentals",
    source: "youtube",
    type: "video",
    duration_minutes: 30,
    level: "beginner",
    url: "https://youtube.com/watch?v=docker-fundamentals",
    skills: ["docker", "containers", "devops"],
    concepts_covered: ["containers vs VMs", "Dockerfile", "images", "volumes", "networking", "docker-compose"],
    prerequisites: ["linux-basics"],
    ai_summary: "Introduction to Docker: containers vs VMs, writing Dockerfiles, building images, managing volumes, container networking, and multi-container apps with docker-compose."
  },
  {
    title: "Infrastructure as Code with Terraform",
    source: "pluralsight",
    type: "course",
    duration_minutes: 180,
    level: "intermediate",
    url: "https://pluralsight.com/courses/terraform-iac",
    skills: ["terraform", "iac", "devops", "cloud-infrastructure"],
    concepts_covered: ["HCL syntax", "providers", "state management", "modules", "workspaces", "terraform cloud"],
    prerequisites: ["cloud-basics", "cli-fundamentals"],
    ai_summary: "Learn Infrastructure as Code with Terraform: HCL syntax, provider configuration, state management, reusable modules, workspaces for environments, and collaboration with Terraform Cloud."
  },
  {
    title: "CI/CD Pipeline Best Practices",
    source: "confluence",
    type: "article",
    duration_minutes: 20,
    level: "intermediate",
    url: "https://confluence.internal/wiki/cicd-best-practices",
    skills: ["ci-cd", "devops", "automation"],
    concepts_covered: ["pipeline stages", "automated testing", "artifact management", "deployment strategies", "rollback"],
    prerequisites: ["git-basics", "docker-fundamentals"],
    ai_summary: "Internal guide to CI/CD best practices: pipeline stage design, test automation strategy, artifact management, blue-green and canary deployments, and automated rollback procedures."
  },
  {
    title: "GitOps with ArgoCD",
    source: "youtube",
    type: "video",
    duration_minutes: 35,
    level: "advanced",
    url: "https://youtube.com/watch?v=gitops-argocd",
    skills: ["gitops", "argocd", "kubernetes", "devops"],
    concepts_covered: ["GitOps principles", "ArgoCD architecture", "application CRDs", "sync strategies", "multi-cluster"],
    prerequisites: ["kubernetes-architecture", "git-basics", "helm"],
    ai_summary: "Implementing GitOps with ArgoCD: declarative application management, ArgoCD architecture, Application CRDs, sync policies, health checks, and multi-cluster deployment strategies."
  },
  {
    title: "Our Production Deployment Runbook",
    source: "confluence",
    type: "document",
    duration_minutes: 25,
    level: "intermediate",
    url: "https://confluence.internal/wiki/prod-deployment-runbook",
    skills: ["devops", "production-operations", "incident-management"],
    concepts_covered: ["deployment checklist", "monitoring verification", "rollback procedure", "incident escalation"],
    prerequisites: ["ci-cd-basics", "kubernetes-basics"],
    ai_summary: "Step-by-step runbook for production deployments: pre-deployment checklist, deployment execution, monitoring verification, rollback procedures, and incident escalation paths."
  },
  // Security & Compliance
  {
    title: "Data Privacy Compliance 2026",
    source: "lms",
    type: "course",
    duration_minutes: 45,
    level: "beginner",
    url: "https://lms.internal/courses/data-privacy-2026",
    skills: ["compliance", "data-privacy", "security"],
    concepts_covered: ["GDPR", "CCPA", "data classification", "PII handling", "breach notification", "consent management"],
    prerequisites: [],
    ai_summary: "Required annual compliance training covering GDPR, CCPA, and internal data privacy policies. Includes data classification levels, PII handling procedures, breach notification requirements, and consent management."
  },
  {
    title: "Security Best Practices for Engineers",
    source: "lms",
    type: "course",
    duration_minutes: 60,
    level: "intermediate",
    url: "https://lms.internal/courses/security-best-practices",
    skills: ["security", "secure-coding", "devops"],
    concepts_covered: ["secure coding", "secrets management", "dependency scanning", "threat modeling", "security reviews"],
    prerequisites: ["software-development-basics"],
    ai_summary: "Engineering-focused security training: secure coding patterns, secrets management with Vault, dependency vulnerability scanning, threat modeling workshops, and security review process."
  },
  {
    title: "OWASP Top 10 for Developers",
    source: "youtube",
    type: "video",
    duration_minutes: 30,
    level: "intermediate",
    url: "https://youtube.com/watch?v=owasp-top-10-devs",
    skills: ["security", "web-security", "secure-coding"],
    concepts_covered: ["injection", "broken authentication", "XSS", "CSRF", "security misconfiguration", "SSRF"],
    prerequisites: ["web-development-basics"],
    ai_summary: "Practical walkthrough of OWASP Top 10 vulnerabilities with code examples: injection attacks, broken authentication, XSS, CSRF, security misconfiguration, and server-side request forgery."
  },
  // Leadership/Soft Skills
  {
    title: "Effective Technical Communication",
    source: "linkedin",
    type: "video",
    duration_minutes: 30,
    level: "beginner",
    url: "https://linkedin.com/learning/technical-communication",
    skills: ["communication", "documentation", "leadership"],
    concepts_covered: ["technical writing", "architecture decision records", "RFC process", "presentation skills"],
    prerequisites: [],
    ai_summary: "Improve technical communication skills: writing clear documentation, architecture decision records (ADRs), the RFC process for proposals, and presenting technical topics to mixed audiences."
  },
  {
    title: "Leading Technical Teams",
    source: "coursera",
    type: "course",
    duration_minutes: 120,
    level: "intermediate",
    url: "https://coursera.org/learn/leading-technical-teams",
    skills: ["leadership", "management", "team-building"],
    concepts_covered: ["tech lead role", "1-on-1s", "team velocity", "hiring", "mentoring", "conflict resolution"],
    prerequisites: ["2-years-engineering-experience"],
    ai_summary: "Course for aspiring and current tech leads: defining the role, running effective 1-on-1s, measuring team health and velocity, hiring practices, mentoring junior engineers, and resolving conflicts."
  },
  {
    title: "Incident Management Playbook",
    source: "drive",
    type: "document",
    duration_minutes: 15,
    level: "intermediate",
    url: "https://drive.google.com/file/incident-management-playbook",
    skills: ["incident-management", "leadership", "operations"],
    concepts_covered: ["incident roles", "severity levels", "communication templates", "postmortem process"],
    prerequisites: [],
    ai_summary: "Manager Raj's incident management playbook: defining incident commander and communication lead roles, severity classification, stakeholder communication templates, and blameless postmortem process.",
    contributed_by: "Raj"
  },
  // General
  {
    title: "System Design Interview Prep",
    source: "youtube",
    type: "video",
    duration_minutes: 45,
    level: "advanced",
    url: "https://youtube.com/watch?v=system-design-prep",
    skills: ["system-design", "architecture", "scalability"],
    concepts_covered: ["load balancing", "caching", "database sharding", "CAP theorem", "message queues", "rate limiting"],
    prerequisites: ["distributed-systems-basics", "database-fundamentals"],
    ai_summary: "System design interview preparation: framework for approaching design questions, load balancing strategies, caching layers, database sharding, CAP theorem trade-offs, and message queue patterns."
  },
  {
    title: "Distributed Systems Fundamentals",
    source: "coursera",
    type: "course",
    duration_minutes: 240,
    level: "advanced",
    url: "https://coursera.org/learn/distributed-systems",
    skills: ["distributed-systems", "architecture", "reliability"],
    concepts_covered: ["consensus algorithms", "replication", "partitioning", "consistency models", "fault tolerance", "Raft", "Paxos"],
    prerequisites: ["networking-fundamentals", "operating-systems"],
    ai_summary: "Deep dive into distributed systems theory and practice: consensus algorithms (Raft, Paxos), data replication strategies, partitioning schemes, consistency models (strong, eventual), and fault tolerance patterns."
  },
  {
    title: "Microservices Architecture Patterns",
    source: "pluralsight",
    type: "course",
    duration_minutes: 150,
    level: "intermediate",
    url: "https://pluralsight.com/courses/microservices-patterns",
    skills: ["microservices", "architecture", "devops"],
    concepts_covered: ["service decomposition", "API gateway", "saga pattern", "CQRS", "event sourcing", "circuit breaker"],
    prerequisites: ["software-architecture-basics", "api-design"],
    ai_summary: "Microservices architecture patterns: service decomposition strategies, API gateway design, distributed transactions with saga pattern, CQRS, event sourcing, and resilience with circuit breakers."
  },
  {
    title: "Service Mesh with Istio",
    source: "youtube",
    type: "video",
    duration_minutes: 40,
    level: "advanced",
    url: "https://youtube.com/watch?v=istio-service-mesh",
    skills: ["service-mesh", "istio", "kubernetes", "networking"],
    concepts_covered: ["sidecar proxy", "traffic management", "mTLS", "observability", "fault injection", "canary deployments"],
    prerequisites: ["kubernetes-networking", "microservices-basics"],
    ai_summary: "Implementing a service mesh with Istio: sidecar proxy architecture, traffic management (routing, splitting), mutual TLS, observability (tracing, metrics), fault injection for testing, and canary deployment strategies."
  },
];

export async function seedDemoContent() {
  const results = [];
  for (const item of DEMO_CONTENT) {
    try {
      const res = await addContent(item);
      results.push({ title: item.title, status: 'ok', res });
      console.log(`[Seed] Added: ${item.title}`);
    } catch (err) {
      results.push({ title: item.title, status: 'error', error: err.message });
      console.error(`[Seed] Failed: ${item.title}`, err);
    }
  }
  console.log(`[Seed] Complete: ${results.filter(r => r.status === 'ok').length}/${DEMO_CONTENT.length} items added`);
  return results;
}
