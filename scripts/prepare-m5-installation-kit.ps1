[CmdletBinding()]
param(
    [string]$OutputDirectory = 'E:\Program Files (x86)\embedded-practice-test-environment\acceptance-kit\m5c-20261023',
    [string]$IsoPath = 'E:\Program Files (x86)\embedded-practice-test-environment\media\m5-acceptance-20261023.iso'
)

$ErrorActionPreference = 'Stop'
$repository = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
$IsoPath = [System.IO.Path]::GetFullPath($IsoPath)
if ((Test-Path -LiteralPath $OutputDirectory) -or (Test-Path -LiteralPath $IsoPath)) {
    throw '输出目录或 ISO 已存在，停止避免覆盖；失败现场保留，重跑时另选新路径。'
}
foreach ($parent in @([System.IO.Path]::GetDirectoryName($OutputDirectory), [System.IO.Path]::GetDirectoryName($IsoPath))) {
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
        throw '输出父目录不存在。'
    }
}

# 只打包明确列出的材料，不扫描整个项目，不包含运行库、个人笔记或凭据文件。
$inputs = @(
    @{ Source = 'release/m5-20261022/embedded-practice-0.1.0-x64-setup.exe'; Target = 'current/embedded-practice-0.1.0-x64-setup.exe'; Expected = '7FBFDE29E999A4B42C4BE286715B8C802D27BCDE32E66A76192A4937FA144D2E' },
    @{ Source = 'release/m5-20261022/README.md'; Target = 'current/README.md' },
    @{ Source = 'release/embedded-practice-0.1.0-x64-setup.exe'; Target = 'legacy-m0/embedded-practice-0.1.0-x64-setup.exe'; Expected = '641EEF07330151D6343047C3AAD2639A70C442B46A26426CD74B281D73A091D8' },
    @{ Source = 'question-banks/trials/STM32F103-UART第二层-30题试用.md'; Target = 'banks/trial/STM32F103-UART第二层-30题试用.md' },
    @{ Source = 'question-banks/trials/题答来源.json'; Target = 'banks/trial/题答来源.json' },
    @{ Source = 'question-banks/trials/README.md'; Target = 'banks/trial/README.md' },
    @{ Source = 'question-banks/examples/格式示例.md'; Target = 'banks/format-example/格式示例.md' },
    @{ Source = 'question-banks/examples/README.md'; Target = 'banks/format-example/README.md' },
    @{ Source = 'question-banks/examples/assets/中文测试图.png'; Target = 'banks/format-example/assets/中文测试图.png' },
    @{ Source = 'question-banks/examples/assets/带 空格.jpg'; Target = 'banks/format-example/assets/带 空格.jpg' },
    @{ Source = 'question-banks/examples/assets/测试.webp'; Target = 'banks/format-example/assets/测试.webp' }
)
foreach ($inputFile in $inputs) {
    $source = Join-Path $repository $inputFile.Source
    $inputFile.Hash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
    if ($inputFile.Expected -and $inputFile.Hash -ne $inputFile.Expected) {
        throw ('安装包与验收基线不符：' + $inputFile.Source)
    }
}

$payload = Join-Path $OutputDirectory 'payload'
[System.IO.Directory]::CreateDirectory($payload) | Out-Null
$manifestFiles = @()
foreach ($inputFile in $inputs) {
    $source = Join-Path $repository $inputFile.Source
    $target = Join-Path $payload $inputFile.Target
    [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($target)) | Out-Null
    [System.IO.File]::Copy($source, $target, $false)
    if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $inputFile.Hash) {
        throw ('材料复制校验失败：' + $inputFile.Source)
    }
    $manifestFiles += [ordered]@{ source = $inputFile.Source; path = $inputFile.Target; bytes = (Get-Item -LiteralPath $target).Length; sha256 = $inputFile.Hash }
}

$utf8 = [System.Text.UTF8Encoding]::new($false)
function Write-NewText([string]$Path, [string]$Contents) {
    $bytes = $utf8.GetBytes($Contents)
    $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
    try { $stream.Write($bytes, 0, $bytes.Length) }
    finally { $stream.Dispose() }
}
$readme = @'
# M5 第三批安装验收材料

本光盘只包含验收输入，不会自动运行安装或导入，也不代表验收通过。

- current：当前结构 6 候选安装包，应用版本 0.1.0，未签名；本轮全新安装使用此文件。
- legacy-m0：旧 M0 对照安装包，应用版本也为 0.1.0。两者覆盖只能验证同版本场景，不能证明更高版本升级；旧程序不能打开当前结构 6 学习库。
- banks/trial：UART 第二层 30 道真实来源试用题，技术答案仍由用户审阅。
- banks/format-example：显式格式示例与三张 2×3 像素小图，只供代码/表格/图片链路检查，不代表真实大图体验。
- manifest.json：材料来源、长度与 SHA-256，复制后据此核对。

先为独立测试虚拟机创建干净系统快照，再复制材料到客户机本地的中文/空格目录。
首次安装选择独立中文/空格路径，记录安装入口、应用版本、实际数据位置和关闭重开结果；不要另装 Node.js 来补足程序运行依赖。
随后在此测试系统建立草稿、收藏、历史、自评、固定队列和显示设置，分别验收覆盖安装、卸载保留和重装。
安装版实际断网后再走导入、练习、更新、退出重开、备份、恢复和自动重启全流程。
Windows 安装完成、光盘生成、文件哈希一致与上述验收分别记录，不能互相替代。
'@
Write-NewText (Join-Path $payload 'README.md') ($readme + [Environment]::NewLine)
$manifest = [ordered]@{ preparedAtUtc = [DateTimeOffset]::UtcNow.ToString('o'); currentAppVersion = '0.1.0'; currentSchemaVersion = 6; legacyAppVersion = '0.1.0'; legacySchemaVersion = $null; files = $manifestFiles }
Write-NewText (Join-Path $payload 'manifest.json') (($manifest | ConvertTo-Json -Depth 6) + [Environment]::NewLine)

# 使用系统 IMAPI2 构建 ISO9660/Joliet 镜像，Joliet 保留中文和空格文件名。
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;
public static class M5IsoStreamWriter {
    public static long Save(object source, string path) {
        IStream stream = (IStream)source;
        byte[] buffer = new byte[1024 * 1024];
        IntPtr countPointer = Marshal.AllocHGlobal(sizeof(int));
        long total = 0;
        try {
            using (FileStream output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None)) {
                while (true) {
                    Marshal.WriteInt32(countPointer, 0);
                    stream.Read(buffer, buffer.Length, countPointer);
                    int count = Marshal.ReadInt32(countPointer);
                    if (count < 0 || count > buffer.Length) throw new IOException("Invalid ISO stream length");
                    if (count == 0) break;
                    output.Write(buffer, 0, count);
                    total += count;
                }
            }
            return total;
        } finally { Marshal.FreeHGlobal(countPointer); }
    }
}
'@
$image = $null
$result = $null
$imageStream = $null
try {
    $image = New-Object -ComObject IMAPI2FS.MsftFileSystemImage
    $image.FileSystemsToCreate = 3
    $image.VolumeName = 'M5_ACCEPTANCE'
    $image.WorkingDirectory = $OutputDirectory
    $image.Root.AddTree($payload, $false)
    $result = $image.CreateResultImage()
    $imageStream = $result.ImageStream
    $writtenBytes = [M5IsoStreamWriter]::Save($imageStream, $IsoPath)
    if ($writtenBytes -ne ([long]$result.TotalBlocks * [long]$result.BlockSize)) {
        throw 'ISO 输出长度与构建结果不一致，保留现场供定位。'
    }
} finally {
    foreach ($comObject in @($imageStream, $result, $image)) {
        if ($null -ne $comObject -and [System.Runtime.InteropServices.Marshal]::IsComObject($comObject)) {
            [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($comObject) | Out-Null
        }
    }
}
foreach ($inputFile in $inputs) {
    if ((Get-FileHash -LiteralPath (Join-Path $repository $inputFile.Source) -Algorithm SHA256).Hash -ne $inputFile.Hash) {
        throw ('准备期间来源文件变化：' + $inputFile.Source)
    }
}
$report = [ordered]@{ isoPath = $IsoPath; isoBytes = (Get-Item -LiteralPath $IsoPath).Length; isoSha256 = (Get-FileHash -LiteralPath $IsoPath -Algorithm SHA256).Hash; payloadDirectory = $payload; sourceFiles = $inputs.Count; status = 'prepared-not-installed' }
Write-NewText (Join-Path $OutputDirectory 'preparation-result.json') (($report | ConvertTo-Json -Depth 4) + [Environment]::NewLine)
$report | ConvertTo-Json -Depth 4
