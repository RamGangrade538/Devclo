# Module 11 — Azure

> **Hinglish:** Ab wahi Linux/Docker skills cloud pe le jao. Azure CLI se resource group, Ubuntu VM, NSG firewall, SSH, app deploy, monitoring, aur cleanup seekhoge. Ye module paise lagata hai — **end me cleanup zaroor** karo.

**Prerequisite:** Azure subscription, Azure CLI (`az version`). Install (Ubuntu):
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az version
az login
```
**Cost safety:** `Standard_B1s` chhota VM hai, phir bhi charges lagte hain. Lab ke baad task 76 me resource group delete karo.
**Variables (har shell me set karo):**
```bash
RG=devclo-lab-rg
LOC=eastus
VM=devclo-lab-vm
```

---

## Task 71: Azure Resource Basics

**Scenario:** Azure account me kaunsi subscription active hai, kaunse resource groups hain, aur VM ke liye kaunse regions available hain — deploy se pehle audit karo.

**Command plan:**
```bash
az account show --output table
az account list --output table
az group list --output table
az account list-locations --query "[?metadata.regionType=='Physical'].name" -o table | head -n 20
az config get 2>/dev/null | head -n 20
```

**Verification:**
- `az account show` active subscription name/id/tenant dikhaye.
- `az group list` existing resource groups dikhaye (khaali bhi ho sakta hai).
- Locations table me `eastus`, `centralindia`, etc. dikhein.
- `az config get` current CLI defaults bataye.

**Note:** Resource group = billing/lifecycle ka container. Region = datacenter location. Subscription = billing boundary. Har resource ka naam globally unique hona zaroori nahi, par public IP/DNS ke liye hota hai.

---

## Task 72: Create an Ubuntu VM

**Scenario:** Practice ke liye chhota Ubuntu VM banao, SSH key auth ke saath. Password login avoid karo.

**Command plan:**
```bash
RG=devclo-lab-rg
LOC=eastus
VM=devclo-lab-vm
az group create --name "$RG" --location "$LOC"
az vm create \
  --resource-group "$RG" \
  --name "$VM" \
  --image Ubuntu2204 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --size Standard_B1s \
  --public-ip-sku Standard \
  --output table
az vm show --resource-group "$RG" --name "$VM" --show-details \
  --query '{name:name,state:powerState,publicIp:publicIps,privateIp:privateIps}' -o table
```

**Verification:**
- `az group create` `provisioningState: Succeeded` dikhaye.
- VM creation output me `publicIpAddress` aur `powerState: VM running`.
- `az vm show --show-details` me public/private IP ho.
- Local `~/.ssh/id_rsa` (ya generated key) exist kare.

**Troubleshoot:** Quota/size error = region me `Standard_B1s` available nahi; doosra region/size try karo. SSH key error = `--generate-ssh-keys` ke bajaye `--ssh-key-values ~/.ssh/id_ed25519.pub`.

---

## Task 73: Secure Network Access

**Scenario:** VM ka NSG (network firewall) inspect karo aur SSH sirf tumhare trusted IP se allow karo — poore internet se nahi.

**Command plan:**
```bash
RG=devclo-lab-rg
VM=devclo-lab-vm
NSG=$(az network nsg list -g "$RG" --query "[0].name" -o tsv)
echo "NSG=$NSG"
az network nsg rule list -g "$RG" --nsg-name "$NSG" -o table
MY_IP=$(curl -s https://ifconfig.me)
echo "My IP: $MY_IP"
az network nsg rule create \
  -g "$RG" --nsg-name "$NSG" \
  -n AllowSSHMyIP \
  --priority 100 \
  --access Allow \
  --protocol Tcp \
  --direction Inbound \
  --destination-port-ranges 22 \
  --source-address-prefixes "$MY_IP/32"
az network nsg rule list -g "$RG" --nsg-name "$NSG" -o table
```

**Restrict existing broad SSH rule (inspect name first):**
```bash
az network nsg rule update \
  -g "$RG" --nsg-name "$NSG" \
  -n default-allow-ssh \
  --source-address-prefixes "$MY_IP/32" \
  --access Allow
```

**Verification:**
- `AllowSSHMyIP` rule port 22, source `<your-ip>/32` dikhaye.
- `default-allow-ssh` ka source bhi tumhara IP ho (ya wo rule delete/deny karo).
- Kisi aur network se port 22 timeout ho (optional test).
- Tumhari IP se SSH abhi bhi kaam kare.

**Important:** NSG me sabse pehle **lowest priority number** evaluate hota hai. Agar priority 1000 pe `Any` allow hai, priority 100 ka allow sirf tumhe allow karta hai — baaki abhi bhi allowed rahenge. Isliye broad rule update/delete karna zaroori hai. Remote SSH session me firewall change karte waqt console access rakho.

---

## Task 74: Connect to the VM

**Scenario:** Azure VM me SSH karke wahi basic Linux checks dobara chalao — hostname, OS, disk, uptime. Cloud VM bhi wahi Linux hai.

**Command plan:**
```bash
RG=devclo-lab-rg
VM=devclo-lab-vm
PUBLIC_IP=$(az vm show -d -g "$RG" -n "$VM" --query publicIps -o tsv)
echo "$PUBLIC_IP"
ssh -o StrictHostKeyChecking=accept-new "azureuser@$PUBLIC_IP" 'hostnamectl; id; uptime; df -h /'
ssh "azureuser@$PUBLIC_IP" 'cat /etc/os-release | head -n 3; free -h'
```

**Verification:**
- SSH bina password ke login kare (key-based).
- `hostnamectl` me Azure VM hostname + Ubuntu version dikhe.
- `id` me `azureuser` ho.
- `df -h /` aur `free -h` output de.

**Troubleshoot:** `Permission denied (publickey)` = galat key (`ssh -i ~/.ssh/<key>`), ya NSG me tumhara IP allow nahi. `Connection timed out` = NSG rule/port 22/VM stopped. `az vm start -g $RG -n $VM` se VM start karo.

---

## Task 75: Deploy an App to Azure

**Scenario:** Local me tested static app ko Azure VM pe deploy karo aur public IP se verify karo. Firewall port bhi kholo.

**Command plan:**
```bash
RG=devclo-lab-rg
VM=devclo-lab-vm
PUBLIC_IP=$(az vm show -d -g "$RG" -n "$VM" --query publicIps -o tsv)
az vm open-port -g "$RG" -n "$VM" --port 80 --priority 110
scp ~/devops-lab/docker-app/index.html "azureuser@$PUBLIC_IP:/tmp/index.html"
ssh "azureuser@$PUBLIC_IP" 'sudo apt update && sudo apt install -y nginx && sudo cp /tmp/index.html /usr/share/nginx/html/index.html && sudo systemctl restart nginx && systemctl is-active nginx'
curl -sS "http://$PUBLIC_IP/" | head -n 5
curl -I "http://$PUBLIC_IP/"
```

**Verification:**
- `az vm open-port` port 80 rule create kare.
- Remote `systemctl is-active nginx` = `active`.
- `curl` HTML me "Built with Docker" ya tumhara content dikhaye.
- `curl -I` = `HTTP/1.1 200 OK`.

**Troubleshoot:** Local curl fail par SSH se `curl localhost` chale = NSG/port issue. Dono fail = nginx/config issue. `sudo nginx -t` aur `journalctl -u nginx -n 30` dekho. Azure NSG + UFW dono check karo.

**Note:** Ye simple deploy hai. Production me app ko non-root user, systemd/Docker, TLS, aur restricted NSG ke saath chalao.

---

## Task 76: Azure Monitoring and Cleanup

**Scenario:** VM health/usage dekho, phir lab ke saare Azure resources delete karo taaki bill na badhe.

**Command plan:**
```bash
RG=devclo-lab-rg
VM=devclo-lab-vm
VM_ID=$(az vm show -g "$RG" -n "$VM" --query id -o tsv)
az vm show -d -g "$RG" -n "$VM" --query '{state:powerState,location:location,size:hardwareProfile.vmSize}' -o table
az monitor metrics list \
  --resource "$VM_ID" \
  --metric "Percentage CPU" \
  --interval PT1M \
  --aggregation Average \
  --output table
az vm boot-diagnostics get-boot-log -g "$RG" -n "$VM" | tail -n 20
```
**Cleanup (resources delete — confirm karke):**
```bash
az group delete --name "$RG" --yes --no-wait
az group exists --name "$RG"
```

**Verification:**
- Metrics table me CPU average value aaun (VM running ho tab).
- Boot log me kernel/systemd lines hon.
- `az group delete` accepted ho.
- Kuch minute baad `az group exists` = `false`.

**Warning:** `az group delete` us resource group ke **saare** resources delete karta hai. Confirm karo ki `$RG` sirf lab ka hai. `--no-wait` background me delete karta hai; `az group exists` se confirm karo. Cost alerts Azure Portal → Cost Management me set karo.

---

## Module 11 Done — Checklist

- [ ] Subscription, regions, resource groups inspect kiye.
- [ ] Azure CLI se Ubuntu VM banaya (SSH key).
- [ ] NSG rules inspect karke SSH trusted IP tak restrict kiya.
- [ ] VM me SSH karke Linux checks chalaye.
- [ ] App deploy karke public HTTP verify kiya.
- [ ] Metrics/boot log dekhe aur resources cleanup kiye.

**Next:** [Module 12 — CI/CD and Advanced DevOps](module-12-cicd-advanced.md)
