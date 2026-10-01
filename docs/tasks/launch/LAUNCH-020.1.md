# TASK ID: LAUNCH-020.1
# TITLE: Add Terraform: full Cloud provisioning
# STATUS: pending
# DEPENDENCIES: LAUNCH-019.2
# ALLOWED FILES: deploy/terraform/main.tf, deploy/terraform/variables.tf, deploy/terraform/outputs.tf
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Spin up a full Cloud (stage 0/1) with one command.

## REQUIRED IMPLEMENTATION

Create `deploy/terraform/main.tf`:

```hcl
terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.42"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

resource "hcloud_ssh_key" "deployer" {
  name       = "deployer-${var.environment}"
  public_key = file(var.ssh_public_key_path)
}

resource "hcloud_server" "cloud_vm" {
  name        = "product-cloud-${var.environment}"
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = "fsn1"  # Frankfurt
  ssh_keys    = [hcloud_ssh_key.deployer.id]

  labels = {
    environment = var.environment
    role        = "cloud"
    managed_by  = "terraform"
  }
}

resource "hcloud_volume" "data" {
  name     = "product-cloud-data-${var.environment}"
  size     = 50
  location = "fsn1"
  format   = "ext4"
}

resource "hcloud_volume_attachment" "data_attach" {
  volume_id = hcloud_volume.data.id
  server_id = hcloud_server.cloud_vm.id
  automount = true
}

resource "hcloud_firewall" "cloud" {
  name = "product-cloud-${var.environment}"
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "null_resource" "provision" {
  triggers = { always_run = timestamp() }
  connection {
    type        = "ssh"
    user        = "root"
    host        = hcloud_server.cloud_vm.ipv4_address
    private_key = file(var.ssh_private_key_path)
  }
  provisioner "remote-exec" {
    inline = [
      "set -e",
      "apt-get update -y",
      "apt-get install -y docker.io docker-compose-plugin",
      "mkdir -p /opt/product",
      "git clone https://github.com/example/product-cloud /opt/product/cloud",
      "cd /opt/product/cloud",
      "docker compose -f docker-compose.prod.yml up -d",
    ]
  }
}

output "cloud_ip" { value = hcloud_server.cloud_vm.ipv4_address }
```

Create `deploy/terraform/variables.tf`:

```hcl
variable "environment" {
  type    = string
  default = "staging"
}
variable "hcloud_token" {
  type      = string
  sensitive = true
}
variable "ssh_public_key_path" {
  type    = string
  default = "~/.ssh/id_ed25519.pub"
}
variable "ssh_private_key_path" {
  type      = string
  default   = "~/.ssh/id_ed25519"
  sensitive = true
}
variable "server_type" {
  type    = string
  default = "cx23"  # 4 vCPU, 16GB, ~€15/mo
}
```

Create `deploy/terraform/outputs.tf`:

```hcl
output "cloud_url" { value = "https://${hcloud_server.cloud_vm.ipv4_address}" }
output "ssh_command" { value = "ssh root@${hcloud_server.cloud_vm.ipv4_address}" }
```

## TESTS

```bash
cd /workspace
test -f deploy/terraform/main.tf || { echo "FAIL"; exit 1; }
test -f deploy/terraform/variables.tf || { echo "FAIL"; exit 1; }
test -f deploy/terraform/outputs.tf || { echo "FAIL"; exit 1; }
grep -q "hcloud_server" deploy/terraform/main.tf || { echo "FAIL"; exit 1; }
echo "OK"
```
