import java.io.File;
import javax.xml.XMLConstants;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.SchemaFactory;

public class ValidateXmlAgainstXsd {
  public static void main(String[] args) throws Exception {
    if (args.length != 2) {
      throw new IllegalArgumentException("Usage: ValidateXmlAgainstXsd <xml> <xsd>");
    }

    SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
    var schema = factory.newSchema(new File(args[1]));
    var validator = schema.newValidator();
    validator.validate(new StreamSource(new File(args[0])));
  }
}
