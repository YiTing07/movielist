const BASE_URL = 'https://movie-list.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/v1/movies/'
const POSTER_URL = BASE_URL + '/posters/'
const MOVIES_PER_PAGE = 12    //目標：每一頁有12筆資料

const movies = []
let filteredMovies = []



const dataPanel = document.querySelector('#data-panel')
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')
const paginator = document.querySelector('#paginator')


// movie card function
function renderMovieList(data) {
  // function 的參數用 data，而不是用 movies，是為了降低耦合性
  //若之後其他地方有需要類似的操作，只要改變傳入的參數就可以重複利用此函式

  let rawHTML = ''
  data.forEach((item) => {
    // title, image. id 隨著每個 item 改變
    rawHTML += `
      <div class="col-sm-3">
        <div class="mb-2">
          <div class="card">
            <img src="${POSTER_URL + item.image}" class="card-img-top" alt="Movie Poster" />
            <div class="card-body">
                <h5 class="card-title"${item.title}</h5>
              </div>
              <div class="card-footer">
                <button 
                  class="btn btn-primary 
                  btn-show-movie" 
                  data-bs-toggle="modal" data-bs-target="#movie-modal" 
                  data-id="${item.id}"
                >
                  More
                </button>
                <button class="btn btn-info btn-add-favorite" data-id="${item.id}"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    `
  })
  dataPanel.innerHTML = rawHTML
}

function renderPaginator(amount) {
  //計算總頁數
  const numberOfPages = Math.ceil(amount / MOVIES_PER_PAGE)
  //製作 template
  let rawHTML = ''

  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`
  }
  //放回 HTML
  paginator.innerHTML = rawHTML
}

function getMoviesByPage(page) {
  //計算起始 index
  //三元運算子：如果搜尋清單有東西，就取搜尋清單 filteredMovies，否則就還是取總清單 movies
  const data = filteredMovies.length ? filteredMovies : movies

  //index第一個為0，但頁數第一個是1，所以page要減1，這樣起始點才是0
  const startIndex = (page - 1) * MOVIES_PER_PAGE
  //回傳切割後的新陣列
  //slice 結尾的index不會包含在因陣列中
  return data.slice(startIndex, startIndex + MOVIES_PER_PAGE)
}

function showMovieModal(id) {
  // get element
  const modalTile = document.querySelector('#movie-modal-title')
  const modalImage = document.querySelector('#movie-modal-image')
  const modalDate = document.querySelector('#movie-modal-date')
  const modalDescription = document.querySelector('#movie-modal-description')

  // send request to show api
  axios.get(INDEX_URL + id)
    .then((response) => {
      const data = response.data.results

      // insert data
      modalTile.innerText = data.title
      modalDate.innerText = 'Release date:' + data.release_date
      modalDescription.innerText = data.description
      modalImage.innerHTML = `
        <img src="${POSTER_URL + data.image}" alt="movie-poster" class="img-fluid">
      `
    })
}

// 收藏電影清單
function addToFavorite (id) {
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []
  const movie = movies.find((movie) => movie.id === id)

  if (list.some((movie) => movie.id === id)) {
    return alert('此電影已經在收藏清單中！')
  }
  list.push(movie)
  localStorage.setItem('favoriteMovies', JSON.stringify(list))
}

// listen to dataPanel 
dataPanel.addEventListener('click', function onPanelClicked(event) {
  if(event.target.matches('.btn-show-movie')) {
    showMovieModal(event.target.dataset.id)
  } else if (event.target.matches('.btn-add-favorite')) {
    addToFavorite(Number(event.target.dataset.id))
  }
})

// listen to the form submitted event
searchForm.addEventListener('submit', function onSearchFormSubmitted (event) {
  //阻止瀏覽器預設行為(瀏覽器會自動更新頁面)
  event.preventDefault()   
  //取得搜尋關鍵字，用 .value 取得 input 值
  const keyword = searchInput.value.trim().toLowerCase()

  //儲存符合條件篩選的項目
  //錯誤處理：若輸入無效字串
  // if (!keyword.length) {
  //   return alert('請輸入有效字串！')
  // }

  //條件篩選
  filteredMovies = movies.filter((movie) => 
    movie.title.toLowerCase().includes(keyword)
  )
  //錯誤處理：無符合條件的結果
  if (filteredMovies.length === 0) {
    return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`)
  }

  //重製分頁器
  renderPaginator(filteredMovies.length)

  //預設顯示第 1 頁的搜尋結果
  renderMovieList(getMoviesByPage(1))
})

paginator.addEventListener('click', function onPaginatorClicked(event) {
  //如果不是點擊 a 標籤，則結束程式
  if (event.target.tagName !== 'A') return
  //透過 dataset 取得被點擊的頁數
  const page = Number(event.target.dataset.page)
  //更新畫面
  renderMovieList(getMoviesByPage(page))
})

// send request to index api
axios.get(INDEX_URL)
  .then((response) => {
    movies.push(...response.data.results)   // ... 是展開運算子
    renderPaginator(movies.length)
    renderMovieList(getMoviesByPage(1))      //呼叫並執行function
  })
  .catch((error) => console.log(error))
