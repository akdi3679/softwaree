# TASK ID: CLOUD-008.1
# TITLE: Add Cloud Helm chart (k8s deployment)
# STATUS: pending
# DEPENDENCIES: ADMIN-012.3
# ALLOWED FILES: platform-cloud/helm/Chart.yaml, platform-cloud/helm/values.yaml, platform-cloud/helm/templates/deployment.yaml, platform-cloud/helm/templates/service.yaml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add a Helm chart so the Cloud can be deployed to Kubernetes.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/helm/Chart.yaml`:

```yaml
apiVersion: v2
name: product-cloud
description: Product Cloud control plane
type: application
version: 0.1.0
appVersion: "0.1.0"
maintainers:
  - name: Product team
```

Create `platform-cloud/helm/values.yaml`:

```yaml
image:
  repository: product/cloud
  tag: latest
  pullPolicy: IfNotPresent

replicaCount: 2

resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 1Gi

service:
  type: ClusterIP
  port: 8787

database:
  host: postgres
  port: 5432
  name: cloud
  user: cloud

minio:
  endpoint: minio.minio.svc.cluster.local:9000

env:
  NODE_ENV: production
  LOG_LEVEL: info
  RATE_LIMIT_PER_ACCOUNT: 600
  RATE_LIMIT_PER_IP: 60

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

ingress:
  enabled: true
  className: nginx
  host: cloud.product.local
  tls:
    enabled: true
    secretName: cloud-tls
```

Create `platform-cloud/helm/templates/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Chart.Name }}
  labels:
    app: {{ .Chart.Name }}
spec:
  {{- if .Values.autoscaling.enabled }}
  replicas: {{ .Values.autoscaling.minReplicas }}
  {{- else }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      app: {{ .Chart.Name }}
  template:
    metadata:
      labels:
        app: {{ .Chart.Name }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 8787
          env:
            - name: DATABASE_URL
              value: "postgres://{{ .Values.database.user }}:$(DB_PASSWORD)@{{ .Values.database.host }}:{{ .Values.database.port }}/{{ .Values.database.name }}"
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: cloud-db
                  key: password
            - name: MINIO_ENDPOINT
              value: {{ .Values.minio.endpoint | quote }}
            - name: MINIO_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: minio-creds
                  key: access-key
            - name: MINIO_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: minio-creds
                  key: secret-key
            - name: NODE_ENV
              value: {{ .Values.env.NODE_ENV | quote }}
            - name: LOG_LEVEL
              value: {{ .Values.env.LOG_LEVEL | quote }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          livenessProbe:
            httpGet:
              path: /health
              port: 8787
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 8787
            initialDelaySeconds: 5
            periodSeconds: 5
```

Create `platform-cloud/helm/templates/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Chart.Name }}
  labels:
    app: {{ .Chart.Name }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: 8787
      protocol: TCP
      name: http
  selector:
    app: {{ .Chart.Name }}
```

Create `platform-cloud/helm/templates/ingress.yaml`:

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Chart.Name }}
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: 100m
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: {{ .Values.ingress.className }}
  tls:
    {{- if .Values.ingress.tls.enabled }}
    - hosts:
        - {{ .Values.ingress.host }}
      secretName: {{ .Values.ingress.tls.secretName }}
    {{- end }}
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ .Chart.Name }}
                port:
                  number: {{ .Values.service.port }}
{{- end }}
```

## TESTS

```bash
cd platform-cloud
test -f helm/Chart.yaml || { echo "FAIL"; exit 1; }
test -f helm/values.yaml || { echo "FAIL"; exit 1; }
test -f helm/templates/deployment.yaml || { echo "FAIL: no deployment"; exit 1; }
test -f helm/templates/service.yaml || { echo "FAIL: no service"; exit 1; }
grep -q "product-cloud" helm/Chart.yaml || { echo "FAIL"; exit 1; }
echo "OK"
```
