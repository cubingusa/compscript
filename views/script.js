function toggleCluster(cluster) {
  document.querySelectorAll('.cluster-' + cluster).forEach((elt) => {
    if (elt.style.display == 'table-row') {
      elt.style.display = 'none'
      document.getElementById('link-' + cluster).innerHTML = '[show]'
    } else {
      elt.style.display = 'table-row'
      document.getElementById('link-' + cluster).innerHTML = '[hide]'
    }
  })
}
