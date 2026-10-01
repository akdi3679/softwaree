terraform {
  required_version = ">= 1.5"
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
  name       = "product-deployer-${var.environment}"
  public_key = file(var.ssh_public_key_path)
}

resource "hcloud_server" "cloud" {
  name        = "product-cloud-${var.environment}"
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.deployer.id]

  labels = {
    environment = var.environment
    role        = "cloud"
    managed_by  = "terraform"
  }
}

resource "hcloud_volume" "data" {
  name     = "product-cloud-data-${var.environment}"
  size     = var.volume_size_gb
  location = var.location
  format   = "ext4"
}

resource "hcloud_volume_attachment" "data" {
  volume_id = hcloud_volume.data.id
  server_id = hcloud_server.cloud.id
  automount = true
}

resource "hcloud_firewall" "cloud" {
  name = "product-cloud-fw-${var.environment}"

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  rule {
    direction  = "tcp"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}