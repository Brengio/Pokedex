const nomePokemon = document.getElementById('nomePokemon');
const numeroPokemon = document.getElementById('numeroPokemon');
const imagemPokemon = document.querySelector('.pokemon_imagem');

const formularioBusca = document.getElementById('formularioBusca');
const campoBusca = document.getElementById('campoBusca');

const listaPokemons = document.getElementById('lista_pokemons');
const botaoCarregar = document.getElementById('carregarMais');

const botoesAba = document.querySelectorAll('.aba');
const visaoLista = document.getElementById('visao-lista');
const visaoDetalhes = document.getElementById('visao-detalhes');
const visaoFavoritos = document.getElementById('visao-favoritos');

const textoTipos = document.getElementById('textoTipos');
const textoHabilidades = document.getElementById('textoHabilidades');
const listaStatus = document.getElementById('listaStatus');
const textoAltura = document.getElementById('textoAltura');
const textoPeso = document.getElementById('textoPeso');
const imagemDetalhe = document.getElementById('imagem-detalhe');

const botaoFavoritar = document.getElementById('botaoFavoritar');
const listaFavs = document.getElementById('lista_favoritos');

let pokemonAtual = 1;
let quantidadeCarregada = 12;
const CHAVE_FAVORITOS = 'pokedex_favoritos';

function mudarAba(nome){
  botoesAba.forEach(b=> b.classList.toggle('ativa', b.dataset.aba===nome));
  visaoLista.classList.toggle('oculto', nome!=='lista');
  visaoDetalhes.classList.toggle('oculto', nome!=='detalhes');
  visaoFavoritos.classList.toggle('oculto', nome!=='favoritos');
}

async function obterPokemon(p){
  try{
    const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${p}`);
    if(!r.ok) return null;
    return await r.json();
  }catch(e){
    console.error(e);
    return null;
  }
}

async function renderizarBasico(p){
  const dados = await obterPokemon(p);
  if(!dados){
    nomePokemon.textContent = 'Não encontrado';
    numeroPokemon.textContent = '';
    imagemDetalhe.src = '';
    return null;
  }
  
  nomePokemon.textContent = dados.name;
  numeroPokemon.textContent = `#${dados.id}`;

  const sprite = dados.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default 
    || dados.sprites.front_default 
    || '';

  imagemDetalhe.src = sprite;
  return dados;
}

async function renderizarDetalhes(p){
  const dados = await renderizarBasico(p);
  if(!dados) return;

  textoTipos.textContent = dados.types.map(t=>t.type.name).join(', ');
  textoHabilidades.textContent = dados.abilities.map(a=>a.ability.name).join(', ');

  textoAltura.textContent = dados.height;
  textoPeso.textContent = dados.weight;

  listaStatus.innerHTML = '';
  dados.stats.forEach(s=>{
    const li=document.createElement('li');
    li.textContent = `${s.stat.name}: ${s.base_stat}`;
    listaStatus.appendChild(li);
  });

  atualizarUIFavorito();
  mudarAba('detalhes');
}

async function listarPokemons(qtd=12){
  for(let id = 1; id <= quantidadeCarregada; id++){

    if(listaPokemons.querySelector(`[data-id="${id}"]`)) continue;

    const dados = await obterPokemon(id);
    if(!dados) continue;

    const li = document.createElement('li');
    li.dataset.id = dados.id;
    li.innerHTML = `<div>#${dados.id} ${dados.name}</div><img src="${dados.sprites.front_default||''}" alt="${dados.name}">`;
    li.addEventListener('click', ()=> renderizarDetalhes(dados.id));

    listaPokemons.appendChild(li);
  }
}

function pegarFavoritos(){ 
  try{return JSON.parse(localStorage.getItem(CHAVE_FAVORITOS))||[];}
  catch{return [];}
}

function salvarFavoritos(lista){
  localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista));
}

function ehFavorito(id){
  return pegarFavoritos().some(f=>f.id===id);
}

function adicionarFavorito(dados, anot=''){
  if(!dados) return;
  const favs = pegarFavoritos();
  if(favs.some(f=>f.id===dados.id)) return;

  favs.push({
    id:dados.id,
    name:dados.name,
    sprite: dados.sprites.front_default||'',
    anotacao: anot
  });

  salvarFavoritos(favs);
  renderizarFavoritos();
  atualizarUIFavorito();
}

function removerFavorito(id){
  let favs = pegarFavoritos();
  favs = favs.filter(f=>f.id!==id);
  salvarFavoritos(favs);
  renderizarFavoritos();
  atualizarUIFavorito();
}

function editarAnotacao(id){
  const favs = pegarFavoritos();
  const idx = favs.findIndex(f=>f.id===id);
  if(idx===-1) return;

  const novo = prompt('Editar anotação:', favs[idx].anotacao||'');
  if(novo===null) return;

  favs[idx].anotacao = novo;
  salvarFavoritos(favs);
  renderizarFavoritos();
}

function renderizarFavoritos(){
  const favs = pegarFavoritos();
  listaFavs.innerHTML = '';

  if(favs.length===0){
    const li=document.createElement('li');
    li.textContent = 'Equipe vazia';
    listaFavs.appendChild(li);
    return;
  }

  favs.forEach(f=>{
    const li=document.createElement('li');
    li.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <img src="${f.sprite}" alt="${f.name}">
        <div>
          <div style="font-weight:800">#${f.id} ${f.name}</div>
          <div style="font-size:12px;color:#333">${f.anotacao||'<i>sem anotação</i>'}</div>
        </div>
      </div>

      <div style="display:flex;gap:6px">
        <button class="pequeno editar">Editar</button>
        <button class="pequeno remover">X</button>
      </div>
    `;

    li.querySelector('.editar').addEventListener('click', ()=> editarAnotacao(f.id));
    li.querySelector('.remover').addEventListener('click', ()=> {
      if(confirm('REMOVER DA EQUIPE?')) removerFavorito(f.id);
    });

    listaFavs.appendChild(li);
  });
}

function atualizarUIFavorito(){
  const idAtual = Number(numeroPokemon.textContent.replace('#',''));
  if(ehFavorito(idAtual)){
    botaoFavoritar.textContent = 'Na equipe (Editar nota)';
  } else {
    botaoFavoritar.textContent = 'Adicionar a equipe';
  }
}

botoesAba.forEach(b=>{
  b.addEventListener('click', ()=> mudarAba(b.dataset.aba));
});

formularioBusca.addEventListener('submit', e=>{
  e.preventDefault();
  const q = campoBusca.value.trim();
  if(!q) return;

  renderizarDetalhes(q.toLowerCase());
  campoBusca.value = '';
});

botaoCarregar.addEventListener('click', ()=>{
  quantidadeCarregada += 12;
  listarPokemons();
});

botaoFavoritar.addEventListener('click', async ()=>{
  const id = Number(numeroPokemon.textContent.replace('#',''));
  const dados = await obterPokemon(id);

  if(ehFavorito(id)){
    editarAnotacao(id);
  } else {
    const anot = prompt('Adicionar anotação (opcional):','');
    adicionarFavorito(dados, anot||'');
  }
});

(async function iniciar(){
  mudarAba('lista');
  await listarPokemons();
  renderizarFavoritos();
  await renderizarDetalhes(pokemonAtual);
})();

const botaoTema = document.getElementById('botaoTema');

botaoTema.addEventListener('click', () => {
  document.body.classList.toggle('modo-escuro');
});
