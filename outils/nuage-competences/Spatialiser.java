/*
 * Spatialisation du nuage de compétences avec le Gephi Toolkit (même moteur que Gephi).
 *   1. importe le graphe (GEXF) ;
 *   2. calcule les communautés : statistique « Modularité » de Gephi (méthode de Louvain) ;
 *   3. dispose les nœuds avec ForceAtlas2, puis une passe « éviter le recouvrement » ;
 *   4. exporte le résultat en GEXF (positions, tailles, classe de modularité).
 *
 * Utilisation : java -cp gephi-toolkit-0.10.1-all.jar Spatialiser.java entree.gexf sortie.gexf
 */
import java.io.File;
import org.gephi.graph.api.GraphController;
import org.gephi.graph.api.GraphModel;
import org.gephi.io.exporter.api.ExportController;
import org.gephi.io.importer.api.Container;
import org.gephi.io.importer.api.EdgeDirectionDefault;
import org.gephi.io.importer.api.ImportController;
import org.gephi.io.processor.plugin.DefaultProcessor;
import org.gephi.layout.plugin.forceAtlas2.ForceAtlas2;
import org.gephi.layout.plugin.forceAtlas2.ForceAtlas2Builder;
import org.gephi.project.api.ProjectController;
import org.gephi.project.api.Workspace;
import org.gephi.statistics.plugin.Modularity;
import org.openide.util.Lookup;

public class Spatialiser {
    public static void main(String[] args) throws Exception {
        ProjectController projet = Lookup.getDefault().lookup(ProjectController.class);
        projet.newProject();
        Workspace espace = projet.getCurrentWorkspace();

        ImportController importeur = Lookup.getDefault().lookup(ImportController.class);
        Container conteneur = importeur.importFile(new File(args[0]));
        conteneur.getLoader().setEdgeDefault(EdgeDirectionDefault.UNDIRECTED);
        importeur.process(conteneur, new DefaultProcessor(), espace);

        GraphModel modele = Lookup.getDefault().lookup(GraphController.class).getGraphModel(espace);
        System.out.println("Nœuds : " + modele.getGraph().getNodeCount() + ", liens : " + modele.getGraph().getEdgeCount());

        // Communautés (Louvain), résultat reproductible
        Modularity modularite = new Modularity();
        modularite.setUseWeight(true);
        modularite.setRandom(false);
        modularite.setResolution(Double.parseDouble(args.length > 2 ? args[2] : "1.0"));
        modularite.execute(modele);
        System.out.printf("Modularité : %.3f%n", modularite.getModularity());

        // ForceAtlas2 : dépliage, puis passe anti-recouvrement (tailles des nœuds respectées)
        ForceAtlas2 fa2 = new ForceAtlas2Builder().buildLayout();
        fa2.setGraphModel(modele);
        fa2.resetPropertiesValues();
        fa2.setScalingRatio(12.0);
        fa2.setGravity(1.2);
        fa2.setEdgeWeightInfluence(1.0);
        fa2.setLinLogMode(false);
        fa2.setBarnesHutOptimize(false);
        fa2.setThreadsCount(1);
        fa2.setAdjustSizes(false);
        fa2.initAlgo();
        for (int i = 0; i < 3000 && fa2.canAlgo(); i++) fa2.goAlgo();
        fa2.setAdjustSizes(true);
        for (int i = 0; i < 800 && fa2.canAlgo(); i++) fa2.goAlgo();
        fa2.endAlgo();

        ExportController exporteur = Lookup.getDefault().lookup(ExportController.class);
        exporteur.exportFile(new File(args[1]), espace);
        System.out.println("Exporté : " + args[1]);
    }
}
