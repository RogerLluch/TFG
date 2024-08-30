import sys
from yt_dlp import YoutubeDL

def descarregarAudio(youtube_url, output_path):
    #Configuració de YoutubeDL
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_path,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }
    
    with YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(youtube_url, download=True)
        title = info_dict.get('title', None)
        return title

if __name__ == "__main__":
    #Obtenir els arguments de la línia de comandes(URL i path de sortida)
    youtube_url = sys.argv[1]
    output_path = sys.argv[2]
    #Intentar descarregar l'audio i retornar el títol. Si no es pot, sortir amb un error
    try:
        title = descarregarAudio(youtube_url, output_path)
        print(f"{title}")
    except Exception as e:
        print(f"Error al descarregar l'audio: {e}")
        sys.exit(1)