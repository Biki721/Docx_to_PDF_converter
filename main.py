from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

opts = Options()
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=opts)

driver.get("https://hpeuat.icertis.com/Search/List/Agreement")
time.sleep(40)


