#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MP4转MP3音频文件转换工具
"""

import subprocess
import os
import sys
from pathlib import Path

def find_ffmpeg():
    """
    查找ffmpeg可执行文件的路径
    
    返回:
        ffmpeg可执行文件的完整路径，如果找不到则返回None
    """
    # 在当前脚本目录的packages文件夹中查找
    script_dir = Path(__file__).parent.absolute()
    packages_dirs = [
        script_dir / "packages",
        script_dir.parent / "packages",
    ]
    
    # 在packages目录中查找
    for packages_dir in packages_dirs:
        if packages_dir.exists():
            # 查找所有子目录中的ffmpeg.exe
            for ffmpeg_exe in packages_dir.rglob("ffmpeg.exe"):
                return str(ffmpeg_exe)
            # 也查找bin目录
            bin_dir = packages_dir / "bin"
            if bin_dir.exists() and (bin_dir / "ffmpeg.exe").exists():
                return str(bin_dir / "ffmpeg.exe")
    
    # 尝试在常见位置查找
    common_paths = [
        script_dir / "ffmpeg.exe",
        script_dir / "packages" / "ffmpeg" / "bin" / "ffmpeg.exe",
        script_dir / "packages" / "ffmpeg" / "ffmpeg.exe",
    ]
    
    for path in common_paths:
        if path.exists():
            return str(path)
    
    # 如果本地找不到，返回None，让系统从PATH中查找
    return None

DEFAULT_FOLDER = r"D:\audio\button\public\voices"


def convert_mp4_to_mp3(folder_path=DEFAULT_FOLDER, quality="192k"):
    """
    将指定文件夹（包括子文件夹）中的MP4文件转换为MP3音频文件
    
    参数:
        folder_path: 文件夹路径，默认为"直播回放1"
        quality: 音频质量（比特率），默认为"192k"
    
    返回:
        成功转换的文件数量
    """
    folder = Path(folder_path)
    if not folder.exists():
        print(f"错误：文件夹 '{folder_path}' 不存在")
        return 0
    
    # 递归查找所有MP4文件（包括子文件夹）
    mp4_files = list(folder.rglob("*.mp4"))
    
    if not mp4_files:
        print(f"在文件夹 '{folder_path}' 中未找到MP4文件")
        return 0
    
    print(f"找到 {len(mp4_files)} 个MP4文件")
    
    # 查找ffmpeg可执行文件
    ffmpeg_path = find_ffmpeg()
    if ffmpeg_path is None:
        ffmpeg_path = 'ffmpeg'  # 尝试从系统PATH查找
        print("\n使用系统PATH中的ffmpeg")
    else:
        print(f"\n使用本地ffmpeg: {Path(ffmpeg_path).name}")
    
    converted_count = 0
    failed_count = 0
    
    for mp4_file in mp4_files:
        # 生成MP3文件名（与MP4文件同名，扩展名改为mp3）
        mp3_file = mp4_file.with_suffix('.mp3')
        
        # 获取相对路径用于显示
        try:
            rel_path = mp4_file.relative_to(folder)
        except ValueError:
            rel_path = mp4_file
        
        # 如果MP3文件已存在，跳过
        if mp3_file.exists():
            print(f"跳过: {rel_path} (MP3已存在)")
            continue
        
        print(f"正在转换: {rel_path} -> {mp3_file.name}")
        
        try:
            # 使用ffmpeg进行转换
            # -i: 输入文件
            # -vn: 禁用视频
            # -ab: 音频比特率
            # -ar: 采样率
            # -y: 自动覆盖输出文件（如果需要）
            cmd = [
                ffmpeg_path,
                '-i', str(mp4_file),
                '-vn',
                '-ab', quality,
                '-ar', '44100',
                '-y',
                str(mp3_file)
            ]
            
            # 执行转换，隐藏ffmpeg的输出信息
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True
            )
            
            print(f"[成功] {mp3_file.name}")
            converted_count += 1
            
        except subprocess.CalledProcessError as e:
            print(f"[失败] {mp4_file.name}")
            print(f"  错误信息: {e.stderr}")
            failed_count += 1
        except FileNotFoundError:
            print("错误: 未找到ffmpeg，请确保ffmpeg已安装并在PATH中")
            print("你可以从以下地址下载ffmpeg: https://ffmpeg.org/download.html")
            return converted_count
        except Exception as e:
            print(f"[失败] {mp4_file.name} - {e}")
            failed_count += 1
    
    print(f"\n转换完成!")
    print(f"成功: {converted_count} 个文件")
    print(f"失败: {failed_count} 个文件")
    
    return converted_count

def main():
    """主函数"""
    print("MP4转MP3音频文件转换工具（支持递归处理子文件夹）")
    print("=" * 50)
    
    # 从命令行参数获取文件夹路径，如果没有则使用默认值
    if len(sys.argv) > 1:
        folder_path = sys.argv[1]
    else:
        folder_path = DEFAULT_FOLDER
    
    print(f"处理文件夹: {folder_path}")
    print(f"（包括所有子文件夹）\n")
    
    # 转换指定文件夹中的MP4文件（包括子文件夹）
    convert_mp4_to_mp3(folder_path)

if __name__ == "__main__":
    main()
