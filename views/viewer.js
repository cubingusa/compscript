function save() {
  document.getElementById('saved').style.display = 'none'
  document.getElementById('error').style.display = 'none'
  var req = new XMLHttpRequest();
  req.onreadystatechange = () => {
    console.log(req)
    if (req.readyState === XMLHttpRequest.DONE) {
      if (req.status === 200) {
        document.getElementById('saved').style.display = 'block'
      } else {
        document.getElementById('error').style.display = 'block'
      }
    }
  }
  req.open('POST', '/' + document.getElementById('competitionId').dataset.competitionid + '/view')
  req.setRequestHeader('Content-Type', 'application/json')
  req.send(JSON.stringify({
    title: document.getElementById('viewTitle').value,
    id: document.getElementById('viewId').value,
    filter: document.getElementById('filter').value,
  }))
}

function hideSaved() {
  document.getElementById('saved').style.display = 'none'
  document.getElementById('error').style.display = 'none'
}
