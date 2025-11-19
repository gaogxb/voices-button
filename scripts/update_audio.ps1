param(
    [string]$RepoRoot = "D:\audio\button",
    [string]$PythonExe = "python",
    [string]$CommitMessage = $( "chore: update audio assets $(Get-Date -Format 'yyyyMMdd-HHmmss')" )
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [string]$Description,
        [ScriptBlock]$Action
    )
    Write-Host ""
    Write-Host ("========== {0} ==========" -f $Description) -ForegroundColor Cyan
    & $Action
}

if (-not (Test-Path $RepoRoot)) {
    throw "仓库路径不存在：$RepoRoot"
}

Push-Location $RepoRoot
try {
    Invoke-Step "运行 mp4_to_mp3.py" {
        & $PythonExe ".\mp4_to_mp3.py"
    }

    Invoke-Step "删除 public\voices 下的 MP4 文件" {
        $voiceDir = Join-Path $RepoRoot "public\voices"
        if (-not (Test-Path $voiceDir)) {
            throw "目录不存在：$voiceDir"
        }
        $mp4Files = Get-ChildItem -Path $voiceDir -Filter "*.mp4" -Recurse -File
        if ($mp4Files.Count -eq 0) {
            Write-Host "没有需要删除的 MP4 文件"
        } else {
            $mp4Files | Remove-Item -Force
            Write-Host ("已删除 {0} 个 MP4 文件" -f $mp4Files.Count)
        }
    }

    Invoke-Step "执行 yarn build:auto" {
        yarn build:auto
    }

    Invoke-Step "推送到 GitHub" {
        git add .
        git commit -m $CommitMessage
        git push origin master
    }

    Write-Host ""
    Write-Host 'All steps finished.' -ForegroundColor Green
}
finally {
    Pop-Location
}

